package org.lowcoder.plugin;

import static java.util.Collections.emptyList;
import static java.util.Collections.emptyMap;
import static java.util.Optional.ofNullable;
import static org.lowcoder.plugin.LowcoderApiQueryExecutionContext.*;
import static org.lowcoder.sdk.constants.Authentication.isAnonymousUser;
import static org.lowcoder.sdk.models.QueryExecutionResult.error;
import static org.lowcoder.sdk.models.QueryExecutionResult.success;
import static org.lowcoder.sdk.util.StreamUtils.collectList;

import java.io.Console;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.apache.commons.collections4.MapUtils;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.lowcoder.sdk.plugin.lowcoderapi.LowcoderApiDatasourceConfig;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.lowcoder.sdk.util.CookieHelper;
import org.pf4j.Extension;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpMethod;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;

import lombok.Getter;
import lombok.Setter;
import reactor.core.publisher.Mono;

@Extension
public class LowcoderApiExecutor implements QueryExecutor<LowcoderApiDatasourceConfig, Object, LowcoderApiQueryExecutionContext> {
    private static final String QUERY_ORG_USERS = "queryOrgUsers";
    private static final String QUERY_FOLDER_APPS = "queryFolderApps";

    private final String cookieName;

    public LowcoderApiExecutor(CookieHelper cookieHelper) {
        cookieName = cookieHelper.getCookieName();
    }

    @Override
    public LowcoderApiQueryExecutionContext buildQueryExecutionContext(LowcoderApiDatasourceConfig datasourceConfig,
                                                                       Map<String, Object> queryConfig,
                                                                       Map<String, Object> requestParams, QueryVisitorContext queryVisitorContext) {

        String folderName = "";
        String actionType = MapUtils.getString(queryConfig, "compType", "");
        Map compObj = MapUtils.getMap(queryConfig, "comp", emptyMap());
        folderName = MapUtils.getString(compObj, "folderName", "");
        MultiValueMap<String, HttpCookie> cookies = queryVisitorContext.getCookies();
        if (actionType.equalsIgnoreCase(QUERY_ORG_USERS) || actionType.equalsIgnoreCase(QUERY_FOLDER_APPS)) {
            return builder()
                    .actionType(actionType)
                    .visitorId(queryVisitorContext.getVisitorId())
                    .applicationOrgId(queryVisitorContext.getApplicationOrgId())
                    .requestCookies(cookies)
                    .folderName(folderName)
                    .port(queryVisitorContext.getSystemPort())
                    .build();
        }
        throw new PluginException(LowcoderApiPluginError.LOWCODER_API_INVALID_REQUEST_TYPE, "LOWCODER_INTERNAL_INVALID_REQUEST_TYPE");
    }

    @Override
    public Mono<QueryExecutionResult> executeQuery(Object o, LowcoderApiQueryExecutionContext context) {

        String actionType = context.getActionType();
        if (actionType.equals(QUERY_ORG_USERS)) {
            return doListOrgUsers0(context);
        } else if (actionType.equals(QUERY_FOLDER_APPS)) {
            return doListAppsOfFolder(context);
        }

        throw new PluginException(LowcoderApiPluginError.LOWCODER_API_INVALID_REQUEST_TYPE, "LOWCODER_INTERNAL_INVALID_REQUEST_TYPE");
    }

    private Mono<QueryExecutionResult> doListOrgUsers0(LowcoderApiQueryExecutionContext context) {

        String visitorId = context.getVisitorId();
        if (isAnonymousUser(visitorId)) {
            return Mono.just(QueryExecutionResult.success(emptyList()));
        }

        String url = "http://localhost:" + context.getPort() + "/api/v1/organizations/" + context.getApplicationOrgId() + "/members";

        return WebClient.builder()
                .defaultCookies(injectCookies(context))
                .build()
                .method(HttpMethod.GET)
                .uri(url)
                .exchangeToMono(clientResponse -> clientResponse.bodyToMono(LowcoderResponse.class))
                .map(responseView -> {
                    if (responseView.isSuccess()) {
                        return success(ofNullable(responseView.getData())
                                .map(it -> MapUtils.getObject(it, "members", emptyList()))
                                .orElse(emptyList())
                        );
                    }
                    return error(LowcoderApiPluginError.LOWCODER_API_REQUEST_ERROR, "REQUEST_ERROR",
                            responseView.getCode(), responseView.getMessage());
                })
                .onErrorResume(e -> Mono.just(
                        QueryExecutionResult.error(LowcoderApiPluginError.LOWCODER_API_REQUEST_ERROR, "LOWCODER_INTERNAL_REQUEST_ERROR",
                                e.getMessage())));
    }

    private Mono<QueryExecutionResult> doListAppsOfFolder(LowcoderApiQueryExecutionContext context) {
        String folderParam = "";
        final boolean isFolderId = Pattern.compile("^\\w{24}$").matcher(context.getFolderName().trim()).matches();
        String visitorId = context.getVisitorId();
        if (isAnonymousUser(visitorId)) {
            return Mono.just(QueryExecutionResult.success(emptyList()));
        }
        if (isFolderId) {
            folderParam = "?id=" + context.getFolderName();
        }

        String url = "http://localhost:" + context.getPort() + "/api/folders/elements" + folderParam;

        return WebClient.builder()
                .defaultCookies(injectCookies(context))
                .build()
                .method(HttpMethod.GET)
                .uri(url)
                .exchangeToMono(clientResponse -> clientResponse.bodyToMono(FolderResponse.class))
                .map(responseView -> {
                    if (responseView.isSuccess()) {
                        List<Object> filteredData = responseView.getData();
                        if (!context.getFolderName().isEmpty() && !isFolderId) {
                            filteredData = filteredData.stream()
                                    .filter(item -> {
                                        Map<String, Object> folderData = (Map<String, Object>) item;
                                        boolean isFolder = (boolean) folderData.get("folder");
                                        String itemName = (String) folderData.get("name");
                                        return isFolder && context.getFolderName().equals(itemName);
                                    })
                                    .collect(Collectors.toList());
                        }
                        return success(ofNullable(filteredData)
                                .orElse(emptyList()));
                    }
                    return error(LowcoderApiPluginError.LOWCODER_API_REQUEST_ERROR, "REQUEST_ERROR",
                            responseView.getCode(), responseView.getMessage());
                })
                .onErrorResume(e -> Mono.just(
                        QueryExecutionResult.error(LowcoderApiPluginError.LOWCODER_API_REQUEST_ERROR, "LOWCODER_INTERNAL_REQUEST_ERROR",
                                e.getMessage())));
    }

    private Consumer<MultiValueMap<String, String>> injectCookies(LowcoderApiQueryExecutionContext request) {
        return currentCookies -> {
            MultiValueMap<String, HttpCookie> requestCookies = request.getRequestCookies();

            requestCookies.entrySet()
                    .stream()
                    .filter(it -> cookieName.equals(it.getKey()))
                    .forEach(entry -> {
                        String cookieName = entry.getKey();
                        List<HttpCookie> httpCookies = entry.getValue();
                        currentCookies.addAll(cookieName, collectList(httpCookies, HttpCookie::getValue));
                    });
        };
    }

    @Getter
    @Setter
    private static class LowcoderResponse {

        public static final int SUCCESS = 1;
        private int code;
        private String message;
        private Map<String, Object> data;

        public boolean isSuccess() {
            return code == SUCCESS;
        }
    }

    @Getter
    @Setter
    private static class FolderResponse {
        public static final int SUCCESS = 1;
        private int code;
        private String message;
        private List<Object> data;

        public boolean isSuccess() {
            return code == SUCCESS;
        }
    }


}
