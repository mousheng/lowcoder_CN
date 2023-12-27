import { CompParams } from "lowcoder-core";
import { ToDataType } from "comps/generators/multi";
import { NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { NameGenerator } from "comps/utils/nameGenerator";
import { Section, sectionNames } from "lowcoder-design";
import { oldContainerParamsToNew } from "../containerBase";
import { toSimpleContainerData } from "../containerBase/simpleContainerComp";
import { TriContainer } from "../triContainerComp/triContainer";
import {
  ContainerChildren,
  ContainerCompBuilder,
} from "../triContainerComp/triContainerCompBuilder";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { BoolCodeControl } from "comps/controls/codeControl";
import { DisabledContext } from "comps/generators/uiCompBuilder";
import { BoolControl } from "@lowcoder-ee/comps/controls/boolControl";
import React, { useContext } from "react";
import { EditorContext } from "comps/editorState";

export const ContainerBaseComp = (function () {
  const childrenMap = {
    disabled: BoolCodeControl,
    showScroll: BoolControl.DEFAULT_TRUE,
  };
  return new ContainerCompBuilder(childrenMap, (props, dispatch) => {
    return (
      <DisabledContext.Provider value={props.disabled}>
        <TriContainer {...props} />
      </DisabledContext.Provider>
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <Section name={sectionNames.interaction}>
              {disabledPropertyView(children)}
            {!children.container.children.autoHeight.getView() && children.showScroll.propertyView({
            label: trans("container.showScroll")})}
              {hiddenPropertyView(children)}
            </Section>
          )}

          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
            <><Section name={sectionNames.layout}>
              {children.container.getPropertyView()}
            </Section><Section name={sectionNames.style}>{children.container.stylePropertyView()}</Section></>
          )}
        </>
      );
    })
    .build();
})(); 

// Compatible with old data
function convertOldContainerParams(params: CompParams<any>) {
  // convert older params to old params
  let tempParams = oldContainerParamsToNew(params);

  if (tempParams.value) {
    const container = tempParams.value.container;
    // old params
    if (container && (container.hasOwnProperty("layout") || container.hasOwnProperty("items"))) {
      const autoHeight = tempParams.value.autoHeight;
      return {
        ...tempParams,
        value: {
          container: {
            showHeader: false,
            body: { 0: { view: container } },
            showBody: true,
            showFooter: false,
            autoHeight: autoHeight,
          },
        },
      };
    }
  }
  return tempParams;
}

class ContainerTmpComp extends ContainerBaseComp {
  constructor(params: CompParams<any>) {
    super(convertOldContainerParams(params));
  }
}

export const ContainerComp = withExposingConfigs(ContainerTmpComp, [NameConfigHidden]);

type ContainerDataType = ToDataType<ContainerChildren<{}>>;

export function defaultContainerData(
  compName: string,
  nameGenerator: NameGenerator
): ContainerDataType {
  return {
    container: {
      header: toSimpleContainerData([
        {
          item: {
            compType: "text",
            name: nameGenerator.genItemName("containerTitle"),
            comp: {
              text: "### " + trans("container.title"),
            },
          },
          layoutItem: {
            i: "",
            h: 5,
            w: 24,
            x: 0,
            y: 0,
          },
        },
      ]),
    },
  };
}
