import { RecordConstructorToView } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { arrayObjectExposingStateControl, jsonObjectExposingStateControl, stringExposingStateControl } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
import { GanteeStyleType, heightCalculator, widthCalculator, GanteeStyle } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { StringControl } from "comps/controls/codeControl";
import ReactResizeDetector from "react-resize-detector";
import { changeEvent, clickEvent, deleteEvent, dbClickEvent, eventHandlerControl, expanderClickEvent } from "../../controls/eventHandlerControl";
import styled, { css } from "styled-components";
import { useEffect, useRef, useState } from "react";
import { MultiCompBuilder, withDefault } from "../../generators";
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { ITaskListColumn, ITaskListHeader, ITooltipContent, StandardTooltipContent, Task, TaskListColumn, TaskListHeader, TasksExample, dataTypeOptions, durationOptions, getStartEndDateForProject, stylingOptionEN, stylingOptionZH } from "./ganteeConstant";
import { AutoHeightControl, JSONObjectControl, NumberControl, manualOptionsControl } from "@lowcoder-ee/index.sdk";
import _ from "lodash"
import { getDayJSLocale } from "@lowcoder-ee/i18n/dayjsLocale";
import { alignWithJustifyControl } from "comps/controls/alignControl";


const Container = styled.div<{ $style: GanteeStyleType | undefined, width: number, autoHeight: boolean }>`
  height: calc( 100% - 3px);
  width: ${props => props.width};
  ._CZjuD {
    overflow-x: ${props => !props.autoHeight ? 'auto' : 'hidden'};
  }
  ._2k9Ys {
    height: 5px;
  }
  ${(props) => props.$style && getStyle(props.$style)}
`;

const getStyle = (style: GanteeStyleType) => {
  return css`
    padding: ${style.padding};
    margin: ${style.margin};
    max-width: ${widthCalculator(style.margin)};
    max-height: ${heightCalculator(style.margin)};
  `;
};

let SelectOption = new MultiCompBuilder(
  {
    key: StringControl,
    label: StringControl,
    cellWidth: withDefault(NumberControl, 100),
    dataType: dropdownControl(dataTypeOptions, 'text'),
    dateFormat: withDefault(StringControl, 'yyyy-MM-dd'),
    hidden: BoolControl,
    horizontalAlignment: alignWithJustifyControl(),
    autoWrap: BoolControl,
    currentId: stringExposingStateControl('currentId', ''),
  },
  (props) => props
).setPropertyViewFn((children) => (
  <>
    {children.key.propertyView({ label: trans("gantee.key") })}
    {children.label.propertyView({ label: trans("gantee.title") })}
    {children.cellWidth.propertyView({ label: trans("gantee.cellWidth") })}
    {children.autoWrap.propertyView({ label: trans("gantee.autoWrap") })}
    {children.horizontalAlignment.propertyView({
      label: trans("textShow.horizontalAlignment"),
      radioButton: true,
    })}
    {children.dataType.propertyView({ label: trans("gantee.dataType") })}
    {children.dataType.getView() === 'date' && children.dateFormat.propertyView({ label: trans("gantee.dateFormat") })}
    {children.hidden.propertyView({ label: trans("floatButton.hidden") })}
  </>
))
  .build();

export const SelectOptionControl = manualOptionsControl(SelectOption, {
  initOptions: [
    { key: 'name', label: trans('gantee.project'), dataType: "text", cellWidth: '150' },
    { key: 'start', label: trans('gantee.from'), dataType: "date", dateFormat: 'YYYY/MM/DD' },
    { key: 'end', label: trans('gantee.to'), dataType: "date", dateFormat: 'YYYY/MM/DD' },
  ],
  uniqField: "key",
});

const viewModeOptions = [
  { label: trans("gantee.hour"), value: ViewMode.Hour },
  { label: trans("gantee.quarterDay"), value: ViewMode.QuarterDay },
  { label: trans("gantee.halfDay"), value: ViewMode.HalfDay },
  { label: trans("gantee.day"), value: ViewMode.Day },
  { label: trans("gantee.week"), value: ViewMode.Week },
  { label: trans("gantee.month"), value: ViewMode.Month },
  { label: trans("gantee.year"), value: ViewMode.Year },
] as const;

const childrenMap = {
  Columns: SelectOptionControl,
  style: styleControl(GanteeStyle),
  viewModeSelect: dropdownControl(viewModeOptions, ViewMode.Day),
  viewMode: stringExposingStateControl('viewMode', ViewMode.Day),
  hiddenListCell: BoolControl,
  tasks: arrayObjectExposingStateControl('tasks', TasksExample),
  StylingOption: withDefault(JSONObjectControl, getDayJSLocale() === "zh-cn" ? stylingOptionZH : stylingOptionEN),
  autoHeight: withDefault(AutoHeightControl, "fixed"),
  allowDateChange: BoolControl,
  allowItemDelete: BoolControl,
  allowProgressChange: BoolControl,
  onChangeEvent: eventHandlerControl([changeEvent]),
  onProgressChangeEvent: eventHandlerControl([changeEvent]),
  onItemDeleteEvent: eventHandlerControl([deleteEvent]),
  otherEvents: eventHandlerControl([clickEvent, dbClickEvent, expanderClickEvent]),
  currentTaskObject: jsonObjectExposingStateControl('currentTaskObject', {}),
  tooltipDateFormat: withDefault(StringControl, 'YYYY/MM/DD HH:mm:ss'),
  tooltipDateUnits: dropdownControl(durationOptions, 'day'),
};

const GanteeView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const transToTasks = (value: any): Task[] => {
    if (value) {
      return value.map((x: any) => ({
        ...x,
        start: new Date(x.start),
        end: new Date(x.end),
      }))
    }
    return []
  }
  const [tasks, setTasks] = useState(transToTasks(props.tasks.value))
  const conRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [viewModeValue, setviewModeValue] = useState(props.viewModeSelect)
  useEffect(() => {
    if (height && width) {
      onResize();
    }
  }, [height, width]);

  useEffect(() => {
    if (_.capitalize(props.viewMode.value) in ViewMode)
      setviewModeValue(_.capitalize(props.viewMode.value) as ViewMode)
  }, [props.viewMode.value])

  useEffect(() => {
    setviewModeValue(props.viewModeSelect)
  }, [props.viewModeSelect])


  useEffect(() => {
    let temp = transToTasks(props.tasks.value)
    setTasks(temp)
  }, [JSON.stringify(props.tasks.value)])
  const onResize = () => {
    const container = conRef.current;
    setWidth(container?.clientWidth ?? 0);
    setHeight(container?.clientHeight ?? 0);
  };

  const handleTasks = (tasks: any, task: Task): Task[] => {
    return tasks.map((t: Task) => (t.id === task.id ? { ...t, hideChildren: !t.hideChildren } : t))
  }


  const handleExpanderClick = (task: Task) => {
    let temp = handleTasks(tasks, task)
    props.tasks.onChange(transToTasks(temp) as any)
    props.otherEvents('expanderClick')
  }

  const calcWidth = (): number => {
    if (viewModeValue === ViewMode.Hour && props.StylingOption?.hourColumnWidth)
      return props.StylingOption?.hourColumnWidth as number
    else if (viewModeValue === ViewMode.QuarterDay && props.StylingOption?.quarterDayColumnWidth)
      return props.StylingOption?.quarterDayColumnWidth as number
    else if (viewModeValue === ViewMode.HalfDay && props.StylingOption?.halfDayColumnWidth)
      return props.StylingOption?.halfDayColumnWidth as number
    else if (viewModeValue === ViewMode.Day && props.StylingOption?.DayColumnWidth)
      return props.StylingOption?.DayColumnWidth as number
    else if (viewModeValue === ViewMode.Month && props.StylingOption?.monthColumnWidth)
      return props.StylingOption?.monthColumnWidth as number
    else if (viewModeValue === ViewMode.Week && props.StylingOption?.weekColumnWidth)
      return props.StylingOption?.weekColumnWidth as number
    else if (viewModeValue === ViewMode.Year && props.StylingOption?.yearColumnWidth)
      return props.StylingOption?.yearColumnWidth as number
    return 65
  }

  const handleTaskChange = (task: Task) => {
    let newTasks = tasks.map((t) => (t.id === task.id ? {
      ...t,
      start: task.start,
      end: task.end,
    } : t))
    if (task.project) {
      const [start, end] = getStartEndDateForProject(newTasks, task.project)
      const project = newTasks[newTasks.findIndex((t) => t.id === task.project)]
      if (project.start.getTime() !== start.getTime() || project.end.getTime() !== end.getTime()) {
        const changedProject = { ...project, start, end }
        newTasks = newTasks.map((t) => (t.id === task.project ? changedProject : t))
      }
    }
    props.tasks.onChange(newTasks as any)
    props.currentTaskObject.onChange(task as any)
    props.onChangeEvent('change')
  }

  const handleProgressChange = async (task: Task) => {
    let temp = tasks.map((t) => (t.id === task.id ? task : t))
    setTasks(temp)
    props.tasks.onChange(temp as any)
    props.currentTaskObject.onChange(task as any)
    props.onProgressChangeEvent('change')
  }

  const handleTaskDelete = (task: Task) => {
    const conf = window.confirm(trans('gantee.deleteConfirmation', { name: task.name }))
    if (conf) {
      let temp = tasks.filter((t) => t.id !== task.id)
      setTasks(temp)
      props.tasks.onChange(temp as any)
      props.currentTaskObject.onChange(task as any)
      props.onItemDeleteEvent('delete')
    }
    return conf
  }

  const handleDblClick = (task: Task) => {
    props.otherEvents('dbClick')
  }

  const handleSelect = (task: Task, isSelected: boolean) => {
    if (isSelected) {
      props.currentTaskObject.onChange(task as any)
      props.otherEvents('click')
    }
    else
      props.currentTaskObject.onChange({})
  }
  let headerHeight = 50
  if (props.StylingOption?.headerHeight) {
    headerHeight = parseInt(props.StylingOption?.headerHeight as string)
  }
  return (
    <ReactResizeDetector onResize={onResize}>
      <Container
        ref={conRef}
        $style={props.style}
        width={width}
        autoHeight={props.autoHeight}
      >
        {tasks.length > 0 && (
          <Gantt
            {...props.StylingOption}
            tasks={tasks}
            onExpanderClick={handleExpanderClick}
            TaskListHeader={(headers: ITaskListHeader) => TaskListHeader(headers,
              {
                Columns: props.Columns,
              })}
            TaskListTable={(Column: ITaskListColumn) => TaskListColumn(Column,
              {
                Columns: props.Columns,
                currentTaskObject: props.currentTaskObject,
                onEvent: props.otherEvents,
              })}
            TooltipContent={(tooltip: ITooltipContent) => StandardTooltipContent(tooltip,
              {
                tooltipDateFormat: props.tooltipDateFormat,
                tooltipDateUnits: props.tooltipDateUnits
              })}
            viewMode={viewModeValue}
            locale={getDayJSLocale() === "zh-cn" ? 'cn' : 'en'}
            columnWidth={calcWidth()}
            listCellWidth={props.hiddenListCell ? '' : undefined}
            onSelect={handleSelect}
            ganttHeight={props.autoHeight ? 0 : height - headerHeight}
            onDateChange={props.allowDateChange ? handleTaskChange : undefined}
            onProgressChange={props.allowProgressChange ? handleProgressChange : undefined}
            onDelete={props.allowItemDelete ? handleTaskDelete : undefined}
            onDoubleClick={handleDblClick}
          />
        )}
      </Container>
    </ReactResizeDetector>
  );
};

let GanteeBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => <GanteeView {...props} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.hiddenListCell.propertyView({ label: trans("gantee.hiddenListCell") })}
          {!children.hiddenListCell.getView() && children.Columns.propertyView({ title: trans('gantee.ColumnsData'), newOptionLabel: trans('gantee.CustomColumn') })}
          {children.tasks.propertyView({
            label: trans("gantee.tasks"),
          })}
          {children.viewModeSelect.propertyView({
            label: trans("gantee.viewMode"),
            tooltip: trans("gantee.viewModeTooltip"),
          })}
          {children.tooltipDateFormat.propertyView({
            label: trans("gantee.tooltipDateFormat"),
          })}
          {children.tooltipDateUnits.propertyView({
            label: trans("gantee.tooltipDateUnits"),
          })}
        </Section>
        <Section name={sectionNames.layout}>
          {children.autoHeight.getPropertyView()}
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.interaction}>
          {children.allowDateChange.propertyView({ label: trans('gantee.allowDateChange') })}
          {children.allowDateChange.getView() && children.onChangeEvent.propertyView({ title: trans('gantee.handleDateChange') })}
          {children.allowProgressChange.propertyView({ label: trans('gantee.allowProgressChange') })}
          {children.allowProgressChange.getView() && children.onProgressChangeEvent.propertyView({ title: trans('gantee.handleProgressChange') })}
          {children.allowItemDelete.propertyView({ label: trans('gantee.allowItemDelete') })}
          {children.allowItemDelete.getView() && children.onItemDeleteEvent.propertyView({ title: trans('gantee.handleItemDelete') })}
          {children.otherEvents.propertyView({})}

        </Section>
        <Section name={sectionNames.style}>
          {children.StylingOption.propertyView({
            label: trans('gantee.JSONStyle'),
          })}
          {children.style.getPropertyView()}
        </Section>
      </>
    ))
    .build();
})();

GanteeBasicComp = class extends GanteeBasicComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const GanteeComp = withExposingConfigs(GanteeBasicComp, [
  new NameConfig("currentTaskObject", trans("gantee.currentTaskObject")),
  new NameConfig("tasks", trans("gantee.tasks")),
  new NameConfig("viewMode", trans("gantee.viewMode")),
  NameConfigHidden,
]);
