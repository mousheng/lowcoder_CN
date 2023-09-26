import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { UICompBuilder, sameTypeMap, withDefault } from "comps/generators";
import { Section, messageInstance, sectionNames } from "lowcoder-design";
import styled from "styled-components";
import { clickLogoEvent, clickMenuEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { StringControl } from "comps/controls/codeControl";
import { navListComp } from "./navItemComp";
import { menuPropertyView } from "./components/MenuItemList";
import { Avatar, Layout, Menu, MenuProps, SiderProps } from "antd";
import { styleControl } from "comps/controls/styleControl";
import { AntLayoutBodyStyle, AntLayoutBodyStyleType, AntLayoutFramerStyle, AntLayoutFramerStyleType, AntLayoutLogoStyle, AntLayoutLogoStyleType, AntLayoutMenuStyle, AntLayoutMenuStyleType, NavigationStyle, ResponsiveLayoutColStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { IContainer } from "../containerBase/iContainer";
import { SimpleContainerComp } from "../containerBase/simpleContainerComp";
import { addMapChildAction } from "comps/generators/sameTypeMap";
import { CompAction, CompActionTypes, deleteCompAction, wrapChildAction, wrapDispatch } from "lowcoder-core";
import { IconControl, JSONObject, JSONValue, NameGenerator, booleanExposingStateControl, dropdownControl, stringExposingStateControl } from "@lowcoder-ee/index.sdk";
import { CompTree, mergeCompTrees } from "../containerBase/utils";
import _ from "lodash";
import { v4 as uuidv4 } from 'uuid';
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { ContainerBaseProps, InnerGrid, gridItemCompToGridItems } from "../containerComp/containerView";
import { HintPlaceHolder } from "lowcoder-design";
import { FooterProps } from "antd-mobile";
const { Header, Content, Footer, Sider } = Layout;

const EventOptions = [
  clickLogoEvent,
  clickMenuEvent,
] as const;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 58px;
  cursor: pointer;
  .span {
    width: 40px;
    height: 40px;
  }
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

const SiderWarpper = styled(Sider) <  SiderProps & { menuStyle: AntLayoutMenuStyleType } > `
.ant-menu-light, .ant-menu-light>.ant-menu {
  background: ${(props) => props.menuStyle.menuBackground};
}
.ant-menu-light.ant-menu-inline .ant-menu-sub.ant-menu-inline {
  background: ${(props) => props.menuStyle.subMenuBackground};
}
.ant-menu-light .ant-menu-item-selected, .ant-menu-light>.ant-menu .ant-menu-item-selected {
  background-color: ${(props) => props.menuStyle.selectedMenuBackground};
  color: ${(props) => props.menuStyle.selectedFontColor};
}
.ant-menu-light .ant-menu-submenu-selected >.ant-menu-submenu-title, .ant-menu-light>.ant-menu .ant-menu-submenu-selected >.ant-menu-submenu-title {
  color: ${(props) => props.menuStyle.selectedFontColor};
}
  
  .ant-layout-sider-children{
    background-color: ${(props) => props.menuStyle.background};
    overflow: auto;
  }
  
  .ant-layout-sider-trigger {
    background-color: ${(props) => props.menuStyle.triggerButtonBgColor};
    position: relative;
    svg {
      color: ${(props) => props.menuStyle.triggerIconColor};
    }
  }
`;

const sharpOptions = [
  { label: trans("avatarComp.square"), value: "square" },
  { label: trans("avatarComp.circle"), value: "circle" },
] as const;

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
    let subItems = TraversalNode(items)
    return getItem(label, id, icon, subItems.length ? subItems : undefined)
  })
}

type ColumnContainerProps = Omit<ContainerBaseProps, 'style'> & {
  style: AntLayoutBodyStyleType,
}

const TitleWarpper = styled.span<{ $style: AntLayoutLogoStyleType, collapsed: boolean }>`
font-weight: 700;
margin-left: 10px;
white-space: nowrap;
display: ${(props) => props.collapsed ? '' : ''};
font-size: ${(props) => props.$style.fontSize};
color: ${(props) => props.$style.fontColor};
`
const AvatarComponent = styled(Avatar) <{ $style: AntLayoutLogoStyleType }>`
  font-size: 48px;
  background-color: ${((props) => props.$style.background)};
  color: ${((props) => props.$style.color)};
  width: 48px;
  height: 48px;
`
const FrameWrapper = styled("div") <{ frameStyle: AntLayoutFramerStyleType, headerBgColor: string }> `
  height: ${(props) => heightCalculator(props.frameStyle.margin)};
  width: ${(props) => widthCalculator(props.frameStyle.margin)};
  overflow: hidden;
  padding: ${(props) => props.frameStyle.padding};
  margin: ${(props) => props.frameStyle.margin};
  border-radius: ${(props) => props.frameStyle.radius};
  box-sizing: border-box;
  border: 1px solid ${(props) => props.frameStyle.border};
  background-color: ${(props) => props.frameStyle.background};
  .ant-layout-header {
    background-color: ${(props) => props.headerBgColor};
  }
  .ant-layout-footer {
    background-color: ${(props) => props.frameStyle.background};
  }
`;

const BodyContainer = (props: ColumnContainerProps) => {
  return (
    <div style={{
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: props.style.containerColor,
      borderRadius: props.style.radius,
    }}>
      <div style={{
        border: `1px solid ${props.style.border}`,
        height: heightCalculator(props.style.margin),
        width: widthCalculator(props.style.margin),
        borderRadius: props.style.radius,
        overflow: 'hidden',
      }}>
        <InnerGrid
          {...props}
          style={{
            ...props.style,
            margin: '0px',
            overflow: 'hidden',
          }}
          radius={props.style.radius}
        />
      </div>
    </div>
  );
};

const HeaderContainer = (props: ColumnContainerProps) => {
  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: props.style.containerColor,
    }}>
      <div style={{
        border: `1px solid ${props.style.border}`,
        height: "100%",
        width: "100%",
        borderRadius: props.style.radius,
      }}>
        <InnerGrid
          {...props}
          hintPlaceholder={HintPlaceHolder}
          radius={props.style.radius}
          containerPadding={[parseInt(props.style.padding), parseInt(props.style.padding)]}
          style={{
            ...props.style,
            overflow: 'hidden',
            height: heightCalculator(props.style.margin),
            width: widthCalculator(props.style.margin),
            backgroundColor: props.style.background,
          }}
        />
      </div>
    </div>
  );
};

const childrenMap = {
  logoUrl: StringControl,
  selectedKey: stringExposingStateControl('selectedKey', ''),
  logoIcon: withDefault(IconControl, "/icon:antd/homeoutlined"),
  logoTitle: withDefault(StringControl, trans('antLayoutComp.logoTitle')),
  shape: dropdownControl(sharpOptions, "circle"),
  containers: withDefault(sameTypeMap(SimpleContainerComp), {
    'header': { view: {}, layout: {} },
  }),
  items: withDefault(navListComp(), [
    {
      label: trans("menuItem") + "1",
      id: uuidv4(),
    },
  ]),
  onEvent: eventHandlerControl(EventOptions),
  TitleStyle: withDefault(styleControl(AntLayoutLogoStyle, trans('antLayoutComp.TitleStyle')), { fontSize: '20px' }),
  bodyStyle: withDefault(styleControl(AntLayoutBodyStyle, trans('antLayoutComp.bodyStyle')), {}),
  headerStyle: withDefault(styleControl(AntLayoutBodyStyle, trans('antLayoutComp.headerStyle')), {}),
  frameStyle: withDefault(styleControl(AntLayoutFramerStyle, trans('antLayoutComp.frameStyle')), {}),
  menuStyle: withDefault(styleControl(AntLayoutMenuStyle, trans('antLayoutComp.menuStyle')), {}),
  footString: withDefault(StringControl, 'Ant Design ©2023 Created by Ant UED'),
  collapsed: booleanExposingStateControl('collapsed'),
};

const NavCompBase = new UICompBuilder(childrenMap, (props, dispatch) => {
  const data = props.items;
  const collapsed = props.collapsed.value;
  const keys = props.selectedKey.value !== '' && props.containers.hasOwnProperty(props.selectedKey.value) ?
    props.selectedKey.value : (Object.keys(props.containers)[0] === 'header' ? Object.keys(props.containers)[1] : Object.keys(props.containers)[0])

  const containerProps = props.containers[keys].children;
  const headerProps = props.containers['header'].children;
  const childDispatch = wrapDispatch(wrapDispatch(dispatch, "containers"), keys);
  const headerDispatch = wrapDispatch(wrapDispatch(dispatch, "containers"), Object.keys(props.containers)[0]);
  const onClick: MenuProps['onClick'] = (e) => {
    props.selectedKey.onChange(e.key)
    props.onEvent('clickMenu')
  }
  return (
    <FrameWrapper
      frameStyle={props.frameStyle}
      headerBgColor={props.headerStyle.containerColor}
    >
      <Layout style={{ height: '100%', margin: '5px' }}>
        <SiderWarpper
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => props.collapsed.onChange(value)}
          menuStyle={props.menuStyle}
        >
          <LogoWrapper
            onClick={() => props.onEvent('clickLogo')}
          >
            {props.logoIcon && (props.logoUrl || (props.logoIcon as any).props.value) && (
              <AvatarComponent
                size={42}
                icon={props.logoIcon}
                src={props.logoUrl}
                shape={props.shape}
                $style={props.TitleStyle}
              />
            )}
            {!collapsed && <TitleWarpper
              $style={props.TitleStyle}
              collapsed={collapsed}
            >
              {props.logoTitle}
            </TitleWarpper>}
          </LogoWrapper>
          <StyledMenu
            selectedKeys={[props.selectedKey.value]}
            items={TraversalNode(data)}
            mode="inline"
            onClick={onClick}
          />
        </SiderWarpper>
        <Layout>
          <Header style={{ padding: 0, height: '58px', lineHeight: '16px' }} >
            <BackgroundColorContext.Provider value={'#fff'}>
              <HeaderContainer
                {...props}
                layout={headerProps.layout.getView()}
                items={gridItemCompToGridItems(headerProps.items.getView())}
                positionParams={headerProps.positionParams.getView()}
                dispatch={headerDispatch}
                emptyRows={5}
                hintPlaceholder={HintPlaceHolder}
                autoHeight={true}
                style={{
                  ...props.headerStyle,
                }}
              />
            </BackgroundColorContext.Provider>
          </Header>
          <Content style={{ margin: '0px', height: '100%' }}>
            <div style={{
              height: '100%',
            }}>
              <BackgroundColorContext.Provider value={props.bodyStyle.background}>
                <BodyContainer
                  layout={containerProps.layout.getView()}
                  items={gridItemCompToGridItems(containerProps.items.getView())}
                  positionParams={containerProps.positionParams.getView()}
                  dispatch={childDispatch}
                  style={{
                    ...props.bodyStyle
                  }}
                />
              </BackgroundColorContext.Provider>
            </div>
          </Content>
          <FooterWarpper>
            <span>
              {props.footString}
            </span>
          </FooterWarpper>
        </Layout>
      </Layout>
    </FrameWrapper>

  );
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name={trans("prop.logo")}>
          {children.logoUrl.propertyView({ label: trans("navigation.logoURL") })}
          {children.logoIcon.propertyView({
            label: trans("avatarComp.icon"),
            IconType: "All",
          })}
          {children.shape.propertyView({
            label: trans("avatarComp.shape"),
            radioButton: true,
          })}
          {children.selectedKey.propertyView({ label: trans('antLayoutComp.selectedKey') })}
        </Section>
        <Section name={trans("menu")}>
          {menuPropertyView(children.items)}
          {children.collapsed.propertyView({ label: trans('antLayoutComp.collapsed') })}
        </Section>
        <Section name={sectionNames.layout}>
          {children.onEvent.getPropertyView()}
          {hiddenPropertyView(children)}
          {children.footString.propertyView({ label: trans('antLayoutComp.footString') })}
        </Section>
        <Section name={sectionNames.style}>
          {children.frameStyle.getPropertyView()}
          {children.bodyStyle.getPropertyView()}
          {children.menuStyle.getPropertyView()}
          {children.headerStyle.getPropertyView()}
          {children.TitleStyle.getPropertyView()}
        </Section>
      </>
    );
  })
  .build();

type MenuItem = Required<MenuProps>['items'][number];
class AntLayoutImplComp extends NavCompBase implements IContainer {
  delayDelteArray: any = [];

  private syncContainers(): this {
    const columns = this.children.items.getView();
    const ids = _.reduce(columns, (ret: Record<string, string>, item) => {
      let data = item.getView()
      ret[data.id.toString()] = data.label
      data.items.map((item, i) => ret[item.getView().id.toString()] = item.getView().label)
      return ret
    }, {})
    ids['header'] = ""
    let containers = this.children.containers.getView();
    // delete
    const actions: CompAction[] = [];
    Object.keys(containers).forEach((id) => {
      if (!ids.hasOwnProperty(id)) {
        this.delayDelteArray.push(id)
        setTimeout(() => {
          this.delayDelteArray.map((id: any) => actions.push(wrapChildAction("containers", wrapChildAction(id, deleteCompAction()))))
          this.delayDelteArray = []
        }, 200)
      }
    });
    // new
    Object.keys(ids).map((id) => {
      if (!containers.hasOwnProperty(id)) {
        let addNode = { layout: {}, items: {} }
        if (id in this.delayDelteArray) {
          this.delayDelteArray = this.delayDelteArray.splice(this.delayDelteArray.indexof(id), 1)
        } else
          actions.push(
            wrapChildAction("containers", addMapChildAction(id, addNode))
          );
      }
    });
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
      if (value.type === "delete" && columns.length <= 1 && action.path.length === 1) {
        messageInstance.warning(trans("antLayoutComp.atLeastOneColumnError"));
        // at least one column
        return this;
      }
    }
    let newInstance = super.reduce(action);
    if (action.type === CompActionTypes.UPDATE_NODES_V2) {
      // Need eval to get the value in StringControl
      newInstance = newInstance.syncContainers();
    }
    return newInstance;
  }

  realSimpleContainer(key?: string): SimpleContainerComp | undefined {
    console.log('realSimpleContainer', key, this.children.containers);
    if (_.isNil(key)) return this.children.containers.children[this.children.selectedKey.getView().value];
    return Object.values(this.children.containers.children).find((container) =>
      container.realSimpleContainer(key)
    );
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
    return false;
  }
}

export const AntLayoutComp = withExposingConfigs(AntLayoutImplComp, [
  new NameConfig("logoUrl", trans("navigation.logoURLDesc")),
  NameConfigHidden,
  new NameConfig("items", trans("navigation.itemsDesc")),
  new NameConfig("selectedKey", trans('antLayoutComp.selectedKey')),
  new NameConfig("collapsed", trans('antLayoutComp.collapsed')),
]);
