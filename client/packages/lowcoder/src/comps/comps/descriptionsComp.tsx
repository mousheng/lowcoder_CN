import { RecordConstructorToView } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { arrayObjectExposingStateControl } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
import { DescriptionsStyle, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { Button, Descriptions } from "antd";
import { withDefault } from "../generators";
import { clickEvent, eventHandlerControl } from "../controls/eventHandlerControl";
import { useEffect, useState } from "react";
import { isNull } from "lodash";
import { DescriptionsItemType } from "antd/es/descriptions";

const layoutOptions = [
  { label: trans("descriptions.horizontal"), value: "horizontal" },
  { label: trans("descriptions.vertical"), value: "vertical" },
] as const;

const RowSizeOptions = [
  { label: trans("descriptions.default"), value: "default" },
  { label: trans("descriptions.middle"), value: "middle" },
  { label: trans("descriptions.small"), value: "small" },
] as const;

const EventOptions = [
  clickEvent,
] as const;

const childrenMap = {
  value: arrayObjectExposingStateControl("value", [
    { label: '姓名', value: '张三' },
    { label: '年龄', value: '15' },
    { label: '家庭住址', value: '浙江省台州市', span: '3' },
    { label: '电话', value: '13888888888' },
    {
      label: '其他情况', value: `演示
    换行`},
  ]),
  title: withDefault(StringControl, trans("descriptions.title")),
  showbordered: BoolControl.DEFAULT_TRUE,
  showEditButton: BoolControl.DEFAULT_TRUE,
  editButtonTitle: withDefault(StringControl, trans('descriptions.edit')),
  parseEnter: BoolControl.DEFAULT_TRUE,
  layout: dropdownControl(layoutOptions, "horizontal"),
  size: dropdownControl(RowSizeOptions, "default"),
  columnCount: withDefault(NumberControl, 2),
  includeMargin: BoolControl.DEFAULT_TRUE,
  style: withDefault(styleControl(DescriptionsStyle), { padding: '20px' }),
  onEvent: eventHandlerControl(EventOptions),
};

const DescriptionsView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const [items, setItems] = useState<DescriptionsItemType[]>()
  const value = props.value.value;
  useEffect(() => {
    if (Array.isArray(value) && !isNull(value)) {
      setItems((value as Object[]).map((item: any, index) => ({
        key: index.toString(),
        label: item?.label ?? '',
        span: Number.isInteger(item?.span) ? parseInt(item?.span) : 1,
        children: props.parseEnter ? (item?.value && (item?.value as string).split('\n').map((item, index) => (<>{index !== 0 ? <br /> : ''}{item}</>))) : item?.value || '',
      })))
    }
  }, [value, props.parseEnter])
  const handleClick = () => {
    props.onEvent('click')
  }
  return (
    <div
      style={{
        margin: props.style.margin,
        padding: props.includeMargin ? props.style.padding : 0,
        width: widthCalculator(props.style.margin),
        height: heightCalculator(props.style.margin),
        background: props.style.background,
        overflow: 'auto',
      }}
    >
      <Descriptions
        // 描述布局
        layout={props.layout}
        // 标题
        title={props.title}
        bordered={props.showbordered}
        size={props.size}
        column={props.columnCount}
        extra={props.showEditButton ? <Button type="primary" onClick={handleClick}>{props.editButtonTitle}</Button> : ''}
        items={items}
      >
      </Descriptions>
    </div>
  );
};

let DescriptionsBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => <DescriptionsView {...props} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("descriptions.value"),
          })}
          {
            children.title.propertyView({
              label: trans("descriptions.title"),
            })
          }
        </Section>
        <Section name={sectionNames.layout}>
          {children.onEvent.getPropertyView()}
          {children.size.propertyView({ label: trans("descriptions.size"), radioButton: true })}
          {children.layout.propertyView({ label: trans("descriptions.layout"), radioButton: true })}
          {children.columnCount.propertyView({ label: trans("descriptions.columnCount") })}
          {children.showbordered.propertyView({ label: trans("descriptions.showbordered") })}
          {children.showEditButton.propertyView({
            label: trans("descriptions.showEditButton"),
          })}
          {children.showEditButton.getView() && children.editButtonTitle.propertyView({
            label: trans("descriptions.edit"),
            tooltip: trans("descriptions.editDesc")
          })}
          {children.parseEnter.propertyView({
            label: trans("descriptions.parseEnter"),
          })}
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
      </>
    ))
    .build();
})();

DescriptionsBasicComp = class extends DescriptionsBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const DescriptionsComp = withExposingConfigs(DescriptionsBasicComp, [
  new NameConfig("value", trans("QRCode.valueDesc")),
  NameConfigHidden,
]);
