import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { UICompBuilder, sameTypeMap, withDefault } from "comps/generators";
import { Section, messageInstance, sectionNames } from "lowcoder-design";
import styled from "styled-components";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { StringControl } from "comps/controls/codeControl";
import { alignWithJustifyControl } from "comps/controls/alignControl";
import { navListComp } from "./navItemComp";
import { menuPropertyView } from "./components/MenuItemList";
import { DownOutlined } from "@ant-design/icons";
import { Avatar, Breadcrumb, Dropdown, Layout, Menu, MenuProps, SiderProps } from "antd";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { styleControl } from "comps/controls/styleControl";
import { NavigationStyle, ResponsiveLayoutColStyleType } from "comps/controls/styleControlConstants";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { IContainer } from "../containerBase/iContainer";
import { runInContext } from "lodash";
import { SimpleContainerComp } from "../containerBase/simpleContainerComp";
import { addMapChildAction } from "comps/generators/sameTypeMap";
import { CompAction, CompActionTypes, deleteCompAction, wrapChildAction, wrapDispatch } from "lowcoder-core";
import { DisabledContext, JSONObject, JSONValue, NameGenerator, stringExposingStateControl } from "@lowcoder-ee/index.sdk";
import { CompTree, mergeCompTrees } from "../containerBase/utils";
import _ from "lodash";
import { v4 as uuidv4 } from 'uuid';
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { ContainerBaseProps, InnerGrid, gridItemCompToGridItems } from "../containerComp/containerView";
import { HintPlaceHolder } from "lowcoder-design";
import { useState } from "react";
import { FooterProps } from "antd-mobile";
const { Header, Content, Footer, Sider } = Layout;


type IProps = {
  justify: boolean;
  bgColor: string;
  borderColor: string;
};

const Wrapper = styled("div") <Pick<IProps, "bgColor" | "borderColor">>`
  height: 100%;
  border-radius: 2px;
  box-sizing: border-box;
  border: 1px solid ${(props) => props.borderColor};
  background-color: ${(props) => props.bgColor};
`;

const NavInner = styled("div") <Pick<IProps, "justify">>`
  margin: 0 -16px;
  height: 100px;
  display: flex;
  justify-content: ${(props) => (props.justify ? "space-between" : "left")};
`;

const Item = styled.div<{
  active: boolean;
  activeColor: string;
  color: string;
}>`
  height: 30px;
  line-height: 30px;
  padding: 0 16px;
  color: ${(props) => (props.active ? props.activeColor : props.color)};
  font-weight: 500;

  &:hover {
    color: ${(props) => props.activeColor};
    cursor: pointer;
  }

  .anticon {
    margin-left: 5px;
  }
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  cursor: pointer;
  .img {
    font-size: 32px;
  }
`;

const ItemList = styled.div<{ align: string }>`
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: ${(props) => props.align};
`;

const StyledMenu = styled(Menu) <MenuProps>`
  &.ant-dropdown-menu {
    min-width: 160px;
  }
  
`;
const FooterWarpper = styled(Footer) <FooterProps>`
  textAlign: center;
  height: 48px;
  verticalAlign: middle;
  backgroundColor: red;
  display: flex;
  align-items: center;
  justify-content: center;
`

const SiderWarpper = styled(Sider) <SiderProps>`
  .ant-layout .ant-layout-has-sider{
    .ant-layout .ant-layout-sider {
      background: red;
    }
  }
  
  .ant-layout-sider-children{
    background-color: #fff;
    overflow: auto;
  }
  
  .ant-layout-sider-trigger {
    background-color: #fff;
    position: relative;
    svg {
      color: #000;
    }
  }
`;

const logoEventHandlers = [clickEvent];
function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const TraversalNode = (data: any): any => {
  return data.map((item: any, idx: number) => {
    const { hidden, label, items, active, onEvent, icon, key, id } = item.getView();
    // console.log(hidden, label, items, active, onEvent, key);
    let subItems = TraversalNode(items)
    return getItem(label, id, icon, subItems.length ? subItems : undefined)
  })
}

type ColumnContainerProps = Omit<ContainerBaseProps, 'style'> & {
  style: ResponsiveLayoutColStyleType,
}

const TitleWarpper = styled.span<{ collapsed: boolean }>`
color: #000;
font-weight: 700;
font-size: 20px;
margin-left: 10px;
white-space: nowrap;
display: ${(props) => props.collapsed ? '' : ''};
`

const BodyContainer = (props: ColumnContainerProps) => {
  return (
    <InnerGrid
      {...props}
      emptyRows={15}
      hintPlaceholder={HintPlaceHolder}
      radius={props.style.radius}
      containerPadding={[0, 0]}
      style={{ overflow: 'hidden', height: '100%', width: '100%', ...props.style }}
    // style={{'overflow': 'hidden'}}
    />
  );
};


// Compatible with historical style data 2022-8-26
// function fixOldStyleData(oldData: any) {
//   if (
//     oldData &&
//     (oldData.hasOwnProperty("accentColor") ||
//       oldData.hasOwnProperty("backgroundColor") ||
//       oldData.hasOwnProperty("borderColor") ||
//       oldData.hasOwnProperty("color"))
//   ) {
//     return {
//       text: oldData.color,
//       accent: oldData.accentColor,
//       background: oldData.backgroundColor,
//       border: oldData.borderColor,
//     };
//   }
//   return oldData;
// }

const childrenMap = {
  logoUrl: StringControl,
  selectedKey: stringExposingStateControl('selectedKey', ''),
  logoEvent: withDefault(eventHandlerControl(logoEventHandlers), [{ name: "click" }]),
  horizontalAlignment: alignWithJustifyControl(),
  style: styleControl(NavigationStyle),
  containers: withDefault(sameTypeMap(SimpleContainerComp), {
    'header': { view: {}, layout: {} },
  }),
  items: withDefault(navListComp(), [
    {

      label: trans("menuItem") + "1",
      id: uuidv4(),
    },
  ]),
};

const NavCompBase = new UICompBuilder(childrenMap, (props, dispatch) => {
  const data = props.items;
  // const containerProps = containers[id].children;
  const items = (
    <>
      {data.map((menuItem, idx) => {
        const { hidden, label, items, active, id, onEvent } = menuItem.getView();
        if (hidden) {
          return null;
        }
        const visibleSubItems = items.filter((item) => !item.children.hidden.getView());
        const subMenuItems: Array<{ key: string; label: string }> = [];
        const subMenuSelectedKeys: Array<string> = [];
        visibleSubItems.forEach((subItem, index) => {
          const key = index + "";
          subItem.children.active.getView() && subMenuSelectedKeys.push(key);
          subMenuItems.push({
            key: key,
            label: subItem.children.label.getView(),
          });
        });
        const item = (
          <Item
            key={idx}
            active={active || subMenuSelectedKeys.length > 0}
            color={props.style.text}
            activeColor={props.style.accent}
            onClick={(e) => {
              console.log('e', e, id);
              props.selectedKey.onChange(id)
              onEvent("click")
            }}
          >
            {label}
            {items.length > 0 && <DownOutlined />}
          </Item>
        );
        if (visibleSubItems.length > 0) {
          const subMenu = (
            <StyledMenu
              onClick={(e) => {
                const { onEvent: onSubEvent } = items[Number(e.key)]?.getView();
                onSubEvent("click");
              }}
              selectedKeys={subMenuSelectedKeys}
              items={subMenuItems}
            />
          );
          return (
            <Dropdown
              key={idx}
              dropdownRender={() => subMenu}
            >
              {item}
            </Dropdown>
          );
        }
        return item;
      })}
    </>
  );

  const justify = props.horizontalAlignment === "justify";
  const keys = props.selectedKey.value !== '' ? props.selectedKey.value : Object.keys(props.containers)[1]
  const containerProps = props.containers[keys].children;
  const headerProps = props.containers['header'].children;
  const childDispatch = wrapDispatch(wrapDispatch(dispatch, "containers"), keys);
  const headerDispatch = wrapDispatch(wrapDispatch(dispatch, "containers"), Object.keys(props.containers)[0]);
  const [collapsed, setCollapsed] = useState(false);
  const onClick: MenuProps['onClick'] = (e) => {
    props.selectedKey.onChange(e.key)
  }
  return (
    <DisabledContext.Provider value={false} >
      <Layout style={{
        height: '100%',
        margin: '5px'
      }}
      >
        <SiderWarpper
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <LogoWrapper>
            {props.logoUrl && (
              <Avatar
                size={32}
                // icon={React.createElement(Icons[logo])}
                src={props.logoUrl}
                shape='square'
              />
            )}
            {!collapsed && <TitleWarpper collapsed={collapsed}>
              {'系统'}
            </TitleWarpper>}
          </LogoWrapper>
          <StyledMenu
            // selectedKeys={subMenuSelectedKeys}
            items={TraversalNode(data)}
            mode="inline"
            onClick={onClick}
          />
        </SiderWarpper>
        <Layout>
          <Header style={{ padding: 0, height: '64px', lineHeight: '16px' }} >
            <BackgroundColorContext.Provider value={'#fff'}>
              <InnerGrid
                {...props}
                layout={headerProps.layout.getView()}
                items={gridItemCompToGridItems(headerProps.items.getView())}
                positionParams={headerProps.positionParams.getView()}
                dispatch={headerDispatch}
                emptyRows={5}
                hintPlaceholder={HintPlaceHolder}
                // minHeight="64px"
                // autoHeight={true}
                radius={'1px'}
                style={{
                  // height: '64px',
                  overflow: 'hidden',
                  background: '#fff',
                  // margin: '5px' 
                }}
                containerPadding={[0, 0]}
              // style={{'overflow': 'hidden'}}
              />
            </BackgroundColorContext.Provider>
          </Header>
          <Content style={{ margin: '0px', height: '100%' }}>
            <div style={{
              // height: 'calc(100% - 48px)', 
              height: '100%',
              // background: '#fff'
            }}>
              <BackgroundColorContext.Provider value={props.style.background}>
                <BodyContainer
                  layout={containerProps.layout.getView()}
                  items={gridItemCompToGridItems(containerProps.items.getView())}
                  positionParams={containerProps.positionParams.getView()}
                  dispatch={childDispatch}
                  // autoHeight={props.autoHeight}
                  style={{
                    radius: '3px',
                    margin: '1px',
                    border: '0px',
                    background: '#fff',
                    padding: '0px',
                    // ...columnCustomStyle,
                    // background: backgroundStyle,
                  }}
                />
              </BackgroundColorContext.Provider>
            </div>
          </Content>
          <FooterWarpper>
            <span>
              Ant Design ©2023 Created by Ant UED
            </span>
          </FooterWarpper>
        </Layout>
      </Layout>
    </DisabledContext.Provider>


    // <DisabledContext.Provider value={false}>
    //   <div style={{ width: '90%', height: '100px' }}>
    //       <ColumnContainer
    //         layout={containerProps.layout.getView()}
    //         items={gridItemCompToGridItems(containerProps.items.getView())}
    //         positionParams={containerProps.positionParams.getView()}
    //         dispatch={childDispatch}
    //         // autoHeight={props.autoHeight}
    //         style={{
    //           radius: '0px',
    //           margin: '0px',
    //           border: '0px',
    //           background: '#fff',
    //           padding: '0px',
    //           // ...columnCustomStyle,
    //           // background: backgroundStyle,
    //         }}
    //       />
    //     </div>
    //   <Wrapper borderColor={props.style.border} bgColor={props.style.background}>
    //     <NavInner justify={justify}>
    //       {props.logoUrl && (
    //         <LogoWrapper onClick={() => props.logoEvent("click")}>
    //           <img src={props.logoUrl} alt="LOGO" />
    //         </LogoWrapper>
    //       )}
    //       {!justify ? <ItemList align={props.horizontalAlignment}>{items}</ItemList> : items}
    //     </NavInner>

    //   </Wrapper>
    // </DisabledContext.Provider>
  );
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name={trans("prop.logo")}>
          {children.logoUrl.propertyView({ label: trans("navigation.logoURL") })}
          {children.selectedKey.propertyView({ label: '选择键' })}
          {children.logoUrl.getView() && children.logoEvent.propertyView({ inline: true })}
        </Section>
        <Section name={trans("menu")}>
          {menuPropertyView(children.items)}
          {children.horizontalAlignment.propertyView({
            label: trans("navigation.horizontalAlignment"),
            radioButton: true,
          })}
        </Section>
        <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
      </>
    );
  })
  .build();

type MenuItem = Required<MenuProps>['items'][number];
class AntLayoutImplComp extends NavCompBase implements IContainer {


  // private getAllKey(data: any) {
  //   let allKey = {}
  //   return new Set(data.map((column: any) =>
  //     column.getView().children.map((child: any) => child.getView().id)));
  // }
  // private TraversalNode = (data: any, fun?: Function): any => {
  //   return data.map((item: any, idx: number) => {
  //     const { hidden, label, items, active, onEvent, icon, key, id } = item.getView();
  //     // console.log(hidden, label, items, active, onEvent, key);
  //     let subItems = this.TraversalNode(items, fun)
  //     if (fun)
  //       return fun(data)
  //     else {
  //       return this.getItem(label, id, icon, subItems.length ? subItems : undefined)
  //     }
  //   })
  // }
  private syncContainers(): this {
    const columns = this.children.items.getView();
    const ids = _.reduce(columns, (ret: Record<string, string>, item) => {
      let data = item.getView()
      ret[data.id.toString()] = data.label
      data.items.map((item, i) => ret[item.getView().id.toString()] = item.getView().label)
      return ret
    }, {})
    ids['header'] = ""
    // const ids: Set<string> = new Set(this.TraversalNode(columns, x=> x.forEach(item => item.children.id)));
    // const ids: Set<string> = new Set(columns.map((column) => String(column.getView().id)));
    let containers = this.children.containers.getView();
    // delete
    const actions: CompAction[] = [];
    Object.keys(containers).forEach((id) => {
      if (!ids.hasOwnProperty(id)) {
        // log.debug("syncContainers delete. ids=", ids, " id=", id);
        actions.push(wrapChildAction("containers", wrapChildAction(id, deleteCompAction())));
      }
    });
    // new
    Object.keys(ids).map((id) => {
      if (!containers.hasOwnProperty(id)) {
        // log.debug("syncContainers new containers: ", containers, " id: ", id);
        actions.push(
          wrapChildAction("containers", addMapChildAction(id, { layout: {}, items: {} }))
        );
      }
    });
    // log.debug("syncContainers. actions: ", actions);
    let instance = this;
    actions.forEach((action) => {
      instance = instance.reduce(action);
    });
    return instance;
  }

  override reduce(action: CompAction): this {
    // debugger
    const columns = this.children.items.getView();
    if (action.type === CompActionTypes.CUSTOM) {
      const value = action.value as JSONObject;
      if (value.type === "push") {
        const itemValue = value.value as JSONObject;
        if (_.isEmpty(itemValue.key)) itemValue.key = itemValue.label;
        action = {
          ...action,
          value: {
            ...value,
            value: { ...itemValue },
          },
        } as CompAction;
      }
      if (value.type === "delete" && columns.length <= 1) {
        messageInstance.warning(trans("responsiveLayout.atLeastOneColumnError"));
        // at least one column
        return this;
      }
    }
    // log.debug("before super reduce. action: ", action);
    let newInstance = super.reduce(action);
    if (action.type === CompActionTypes.UPDATE_NODES_V2) {
      // Need eval to get the value in StringControl
      newInstance = newInstance.syncContainers();
    }
    // log.debug("reduce. instance: ", this, " newInstance: ", newInstance);
    return newInstance;
  }

  realSimpleContainer(key?: string): SimpleContainerComp | undefined {
    console.log('realSimpleContainer', key, this.children.containers);
    if (_.isNil(key)) return this.children.containers.children[this.children.selectedKey.getView().value];
    return Object.values(this.children.containers.children).find((container) =>
      container.realSimpleContainer(key)
    );
    // let selectedTabKey = this.children.selectedKey.getView().value;
    // const tabs = this.children.items.getView();
    // const selectedTab = tabs.find((tab) => tab.key === selectedTabKey) ?? tabs[0];
    // const id = String(selectedTab.id);
    // if (_.isNil(key)) return this.children.containers.children[id];
    // return Object.values(this.children.containers.children).find((container) =>
    //   container.realSimpleContainer(key)
    // );
  }

  getCompTree(): CompTree {
    const containerMap = this.children.containers.getView();
    const compTrees = Object.values(containerMap).map((container) => container.getCompTree());
    return mergeCompTrees(compTrees);
  }

  findContainer(key: string): IContainer | undefined {
    const containerMap = this.children.containers.getView();
    for (const container of Object.values(containerMap)) {
      const foundContainer = container.findContainer(key);
      if (foundContainer) {
        return foundContainer === container ? this : foundContainer;
      }
    }
    return undefined;
  }

  getPasteValue(nameGenerator: NameGenerator): JSONValue {
    const containerMap = this.children.containers.getView();
    const containerPasteValueMap = _.mapValues(containerMap, (container) =>
      container.getPasteValue(nameGenerator)
    );

    return { ...this.toJsonValue(), containers: containerPasteValueMap };
  }

  override autoHeight(): boolean {
    // return this.children.autoHeight.getView();
    return false;
  }
}

export const AntLayoutComp = withExposingConfigs(AntLayoutImplComp, [
  new NameConfig("logoUrl", trans("navigation.logoURLDesc")),
  NameConfigHidden,
  new NameConfig("items", trans("navigation.itemsDesc")),
  new NameConfig("selectedKey", "selectedKey"),
]);
