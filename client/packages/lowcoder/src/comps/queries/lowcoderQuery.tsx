import { withTypeAndChildrenAbstract } from "comps/generators/withType";
import { trans } from "i18n";
import { CompConstructor } from "lowcoder-core";
import { Dropdown, ValueFromOption } from "lowcoder-design";
import { buildQueryCommand, FunctionProperty, toQueryView } from "./queryCompUtils";
import { withPropertyViewFn } from "../generators";
import { ParamsStringControl } from "../controls/paramsControl";

const CommandOptions = [
  { label: trans("lowcoderQuery.queryOrgUsers"), value: "queryOrgUsers" },
  { label: trans("lowcoderQuery.queryFolderApps"), value: "queryFolderApps" },
] as const;

const folderName = {
  folderName: withPropertyViewFn(ParamsStringControl, (comp) =>
    comp.propertyView({
      label: trans('lowcoderQuery.folderNameLabel'),
      placement: "bottom",
      placeholder: trans('lowcoderQuery.folderNamePlaceHolder'),
    })
  ),
};

const CommandMap: Record<
  ValueFromOption<typeof CommandOptions>,
  CompConstructor<FunctionProperty[]>
> = {
  queryOrgUsers: buildQueryCommand({}),
  queryFolderApps: buildQueryCommand({ ...folderName }),
};

const LowcoderTmpQuery = withTypeAndChildrenAbstract(CommandMap, "queryOrgUsers", {});

export class LowcoderQuery extends LowcoderTmpQuery {
  override getView() {
    const params = this.children.comp.getView();
    return toQueryView(params);
  }

  override getPropertyView() {
    return (
      <>
        <Dropdown
          label={trans("query.method")}
          placement={"bottom"}
          options={CommandOptions}
          value={this.children.compType.getView()}
          onChange={(value) => this.dispatch(this.changeValueAction({ compType: value, comp: {} }))}
        />
        {this.children.comp.getPropertyView()}
      </>
    );
  }
}
