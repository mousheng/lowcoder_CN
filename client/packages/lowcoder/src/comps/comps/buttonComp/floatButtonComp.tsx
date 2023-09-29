import { RecordConstructorToView } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
import { FloatButtonStyle, FloatButtonStyleType } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { StringControl } from "comps/controls/codeControl";
import { FloatButton } from 'antd';
import { withDefault } from "../../generators";
import { IconControl } from "comps/controls/iconControl";
import styled from "styled-components";
import { ButtonEventHandlerControl, MultiCompBuilder, NumberControl, manualOptionsControl, valueComp } from "@lowcoder-ee/index.sdk";

const Wrapper = styled.div<{ $style: FloatButtonStyleType }>`
    width: 0px;
    height: 0px;
    overflow: hidden;
`
const buttonTypeOption = [
    { label: trans('floatButton.custom'), value: 'custom' },
    { label: trans('floatButton.backTop'), value: 'backTop' },
] as const;

const buttonShapeOption = [
    { label: trans('floatButton.square'), value: 'square' },
    { label: trans('floatButton.circle'), value: 'circle' },
] as const;

const buttonThemeOption = [
    { label: trans('floatButton.primary'), value: 'primary' },
    { label: trans('floatButton.default'), value: 'default' },
] as const;

const buttonGroupOption = new MultiCompBuilder(
    {
        id: valueComp<number>(-1),
        label: StringControl,
        badge: withDefault(NumberControl, 0),
        description: withDefault(StringControl, ''),
        buttonType: dropdownControl(buttonTypeOption, 'custom'),
        icon: IconControl,
        onEvent: ButtonEventHandlerControl,
    },
    (props) => props
)
    .setPropertyViewFn((children) => (
        <>
            {children.label.propertyView({ label: trans("label") })}
            {children.description.propertyView({ label: trans("floatButton.description") })}
            {children.badge.propertyView({ label: trans("floatButton.badge") })}
            {children.buttonType.propertyView({ label: trans("floatButton.buttonType"), radioButton: true })}
            {children.buttonType.getView() === 'custom' && children.icon.propertyView({ label: trans("icon") })}
            {children.buttonType.getView() === 'custom' && children.onEvent.getPropertyView()}
        </>
    ))
    .build();

const childrenMap = {
    value: stringExposingStateControl("value"),
    includeMargin: BoolControl.DEFAULT_TRUE,
    image: StringControl,
    icon: withDefault(IconControl, '/icon:antd/questioncircleoutlined'),
    style: styleControl(FloatButtonStyle),
    buttons: manualOptionsControl(buttonGroupOption, {
        initOptions: [
            { id: 0, label: trans("optionsControl.optionI", { i: '1' }), icon: "/icon:antd/filetextoutlined", badge: '1' },
            { id: 1, label: trans("optionsControl.optionI", { i: '2' }), icon: "/icon:antd/filetextoutlined", buttonType: 'backTop' },
        ],
        autoIncField: "id",
    }),
    shape: dropdownControl(buttonShapeOption, 'circle'),
    buttonTheme: dropdownControl(buttonThemeOption, 'primary'),
};

const FloatButtonView = (props: RecordConstructorToView<typeof childrenMap>) => {
    return (
        <Wrapper
            $style={props.style}
        >
            <FloatButton.Group
                trigger="hover"
                style={{ right: -20 }}
                icon={props.icon}
                shape={props.shape}
                badge={{ count: props.buttons.reduce((sum, i) => sum + (i.buttonType === 'custom' ? i.badge : 0), 0), color: props.style.badgeColor }}
                type={props.buttonTheme}
            >
                {props.buttons.map((button: any) => {
                    return button?.buttonType === 'custom' ? (<FloatButton
                        key={button?.id}
                        icon={button?.icon}
                        onClick={() => button.onEvent("click")}
                        tooltip={button?.label}
                        description={button?.description}
                        badge={{ count: button?.badge, color: props.style.badgeColor }}
                    />) : (
                        <FloatButton.BackTop visibilityHeight={0} description={button?.description} tooltip={button?.label}></FloatButton.BackTop>
                    )
                }
                )}


            </FloatButton.Group>
        </Wrapper>
    );
};

let FloatButtonBasicComp = (function () {
    return new UICompBuilder(childrenMap, (props) => <FloatButtonView {...props} />)
        .setPropertyViewFn((children) => (
            <>
                <Section name={sectionNames.basic}>
                    {children.buttons.propertyView({})}
                </Section>
                <Section name={sectionNames.layout}>
                    {children.icon.propertyView({ label: trans("icon") })}
                    {children.shape.propertyView({ label: trans("floatButton.buttonShape"), radioButton: true })}
                    {children.buttonTheme.propertyView({ label: trans("floatButton.buttonTheme"), radioButton: true })}
                    {hiddenPropertyView(children)}
                </Section>
                <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
            </>
        ))
        .build();
})();

FloatButtonBasicComp = class extends FloatButtonBasicComp {
    override autoHeight(): boolean {
        return true;
    }
};

export const FloatButtonComp = withExposingConfigs(FloatButtonBasicComp, [
    new NameConfig("value", trans("QRCode.valueDesc")),
    NameConfigHidden,
]);
