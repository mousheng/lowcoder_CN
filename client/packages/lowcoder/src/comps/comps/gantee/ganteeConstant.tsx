import styled from 'styled-components';
import dayjs from "dayjs";
import _ from 'lodash'
import React from 'react';
import { trans } from '@lowcoder-ee/i18n';
import { getDayJSLocale } from '@lowcoder-ee/i18n/dayjsLocale';

declare type TaskType = "task" | "milestone" | "project";

export const dataTypeOptions = [
    { label: trans('gantee.date'), value: "date" },
    { label: trans('gantee.text'), value: "text" },
] as const;

export const durationOptions = [
    { label: trans('gantee.day'), value: 'day' },
    { label: trans('gantee.week'), value: "week" },
    { label: trans('gantee.quarter'), value: "quarter" },
    { label: trans('gantee.month'), value: "month" },
    { label: trans('gantee.year'), value: "year" },
    { label: trans('gantee.hour'), value: "hour" },
    { label: trans('gantee.minute'), value: "minute" },
    { label: trans('gantee.second'), value: "second" },
    { label: trans('gantee.millisecond'), value: "millisecond" },
] as const;

export interface Task {
    id: string;
    type: TaskType;
    name: string;
    start: Date;
    end: Date;
    nameTitle?: string;
    startTitle?: string;
    endTitle?: string;
    progress: number;   // 0-100
    styles?: {
        backgroundColor?: string;
        backgroundSelectedColor?: string;
        progressColor?: string;
        progressSelectedColor?: string;
    };
    isDisabled?: boolean;
    project?: string;
    dependencies?: string[];
    hideChildren?: boolean;
    displayOrder?: number;
}

const GanteeTableHeader = styled.div`
    display: table;
    border-bottom: #e6e4e4 1px solid;
    border-top: #e6e4e4 1px solid;
    border-left: #e6e4e4 1px solid;
  .ganttTable_Header {
    display: table-row;
    list-style: none;
  }
  .ganttTable_HeaderSeparator {
    border-right: 1px solid rgb(196, 196, 196);
    opacity: 1;
    margin-left: -2px;
  }
  `
const GanttTableHeaderItem = styled.div<{ minWidth: number, horizontalAlignment?: string }>`
display: table-cell;
vertical-align: -webkit-baseline-middle;
vertical-align: middle;
background-color: #ffffff;
text-align: ${props => props?.horizontalAlignment ?? 'left'};
min-width: ${props => props.minWidth}px;
`
const TaskListCell = styled.div<{ cellWidth: number, horizontalAlignment?: string, autoWrap: boolean }>`
display: table-cell;
vertical-align: middle;
white-space: ${props => props.autoWrap ? 'normal' : 'nowrap'};
word-wrap: ${props => props.autoWrap ? 'break-word' : ''};
word-break: break-all;
overflow: hidden;
border-left: #e6e4e4 1px solid;
padding-left: 4px;
padding-right: 4px;
overflow-y: hidden;
text-align: ${props => props?.horizontalAlignment ?? 'left'};
min-width: ${props => props.cellWidth}px;
max-width: ${props => props.cellWidth}px;
`

const TooltipWapper = styled.div<{ fontSize: string, fontFamily: string }>`
    background: #fff;
    padding: 12px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
    .tooltipDefaultContainerParagraph {
        font-size: ${props => props.fontSize}px;
        margin-bottom: 6px;
        color: #666;
        font-family: ${props => props.fontFamily};
    }
    .tooltipDetailsContainer {
        position: absolute;
        display: flex;
        flex-shrink: 0;
        pointer-events: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
    .tooltipDetailsContainerHidden {
        visibility: hidden;
        position: absolute;
        display: flex;
        pointer-events: none;
    }
  `

const GanteeTableWapper = styled.div<{ fontSize: string, fontFamily: string, rowHeight: number }>`
display: table;
border-bottom: #e6e4e4 1px solid;
border-left: #e6e4e4 1px solid;
.taskListTableRow {
    display: table-row;
    text-overflow: ellipsis;
    height: ${props => props.rowHeight}px;
    font-size: ${props => props.fontSize}px;
}
.taskListNameWrapper {
    display: flex;
}
.taskListExpander {
    color: rgb(86 86 86);
    font-size: ${props => props.fontSize}px;
    padding: 0.15rem 0.2rem 0rem 0.2rem;
    user-select: none;
    cursor: pointer;
    font-family: ${props => props.fontFamily};
}
.taskListEmptyExpander {
    font-size: ${props => props.fontSize}px;
    padding-left: 1rem;
    user-select: none;
    font-family: ${props => props.fontFamily};
}
`
export function getStartEndDateForProject(tasks: any, projectId: string) {
    const projectTasks = tasks.filter((t: Task) => t.project === projectId)
    let start = projectTasks[0].start
    let end = projectTasks[0].end

    for (let i = 0; i < projectTasks.length; i++) {
        const task = projectTasks[i]
        if (start.getTime() > task.start.getTime()) {
            start = task.start
        }
        if (end.getTime() < task.end.getTime()) {
            end = task.end
        }
    }
    return [start, end]
}

export interface ITaskListColumn {
    rowHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    locale: string;
    tasks: Task[];
    selectedTaskId: string;
    setSelectedTask: (taskId: string) => void;
    onExpanderClick: (task: Task) => void;
}

const displayColumn = (i: any, t: any) => {
    return i?.key in t
        ? (i?.dataType === 'date'
            ? (dayjs((t as any)[i.key]).isValid()
                ? dayjs((t as any)[i.key]).format(i?.dateFormat)
                : '')
            : ((t as any)[i.key]).toString())
        : ''
}

export interface ITooltipContent {
    task: Task;
    fontSize: string;
    fontFamily: string;
}

export const StandardTooltipContent: React.FC<ITooltipContent> = ({ task, fontSize, fontFamily }, context) => {
    const style = {
        fontSize,
        fontFamily,
    };
    let dateFormat = context.tooltipDateFormat ?? 'YYYY/MM/DD HH:mm:ss'
    let utilsText = getDayJSLocale() !== "zh-cn" ? `${context.tooltipDateUnits}(s)` : trans(`gantee.${context.tooltipDateUnits}` as any)
    return (
        <TooltipWapper {...style}>
            <b style={{ fontSize: Math.floor(parseInt(fontSize) * 1.1) }}>{`${task.name
                }: ${dayjs(task.start).format(dateFormat)} - ${dayjs(task.end).format(dateFormat)}`}</b>
            {task.end.getTime() - task.start.getTime() !== 0 && (
                <p className={'tooltipDefaultContainerParagraph'}>{`${trans('gantee.duration')}: ${dayjs(task.end).diff(task.start, context.tooltipDateUnits)} ${utilsText}`}</p>
            )}

            <p className={'tooltipDefaultContainerParagraph'}>
                {!!task.progress && `${trans('gantee.progress')}: ${task.progress} %`}
            </p>
        </TooltipWapper>
    );
};

export const TaskListColumn: React.FC<ITaskListColumn> = ({
    rowHeight,
    rowWidth,
    tasks,
    fontFamily,
    fontSize,
    locale,
    onExpanderClick,
}, context) => {
    return (
        <GanteeTableWapper
            fontFamily={fontFamily}
            fontSize={fontSize}
            rowHeight={rowHeight}
        >
            {tasks.map((t: any, taskIndex: number) => {
                let expanderSymbol = "";
                if (t.hideChildren === false) {
                    expanderSymbol = "▼";
                } else if (t.hideChildren === true) {
                    expanderSymbol = "▶";
                }
                return (
                    <div
                        className="taskListTableRow"
                        style={{
                            backgroundColor: taskIndex % 2 === 1 ? '#f5f5f5' : '#ffffff',
                        }}
                        key={`${t.id}row`}
                        onDoubleClick={() => onExpanderClick(t)}
                        onClick={() => {
                            context.currentTaskObject.onChange(t)
                            context.onEvent('click')
                        }}
                    >
                        {context.Columns.map((i: any, index: number) => !i?.hidden ?
                            (<TaskListCell
                                cellWidth={i?.cellWidth}
                                horizontalAlignment={i?.horizontalAlignment}
                                key={`${i?.key}taskListCell`}
                                autoWrap={i?.autoWrap}
                            >
                                {index === 0 ? (<div
                                    className={
                                        expanderSymbol
                                            ? 'taskListExpander'
                                            : 'taskListEmptyExpander'
                                    }
                                    style={{
                                        fontSize: `${fontSize}px`
                                    }}
                                    onClick={() => onExpanderClick(t)}
                                >
                                    {expanderSymbol}
                                    {displayColumn(i, t)}
                                </div>) : displayColumn(i, t)}

                            </TaskListCell>) : ''
                        )
                        }

                    </div>
                );
            })}
        </GanteeTableWapper>
    );
};

export interface ITaskListHeader {
    headerHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
}

export const TaskListHeader: React.FC<{
    headerHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
}> = ({ headerHeight, fontFamily, fontSize, rowWidth }: ITaskListHeader, context: any) => {
    return (
        <GanteeTableHeader
            style={{
                fontFamily: fontFamily,
                fontSize: fontSize,
            }}
        >
            <div
                className={'ganttTable_Header'}
                style={{
                    height: headerHeight - 2,
                }}
            >
                {
                    context.Columns.map((i: any, index: number) => {
                        if (!i?.hidden)
                            return (
                                <React.Fragment key={index}>
                                    <div
                                        className={'ganttTable_HeaderSeparator'}
                                        style={{
                                            height: headerHeight * 0.5,
                                            marginTop: headerHeight * 0.2,
                                        }}
                                    />
                                    <GanttTableHeaderItem
                                        minWidth={i?.cellWidth}
                                        horizontalAlignment={i.horizontalAlignment}>
                                        &nbsp;{i?.label}
                                    </GanttTableHeaderItem>
                                </React.Fragment>
                            )
                    })
                }

            </div>
        </GanteeTableHeader>
    );
};

const currentDate = new Date()
export const TasksExample = [
    {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).getTime(),
        name: trans('gantee.exampleProject', { i: '1' }),
        id: "ProjectSample",
        progress: 25,
        type: "project",
        hideChildren: true,
        // displayOrder: 1,
    },
    {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 2, 12, 28).getTime(),
        name: trans('gantee.exampleIdea'),
        id: "Task 0",
        progress: 45,
        type: "task",
        project: "ProjectSample",
        // displayOrder: 2,
    },
    {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).getTime(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4, 0, 0).getTime(),
        name: trans('gantee.exampleRelease'),
        id: "Task 1",
        progress: 25,
        dependencies: ["Task 0"],
        type: "task",
        project: "ProjectSample",
        // displayOrder: 3,
    },
    {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4).getTime(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8, 0, 0).getTime(),
        name: trans('gantee.exampleDiscus'),
        id: "Task 2",
        progress: 10,
        dependencies: ["Task 1"],
        type: "task",
        project: "ProjectSample",
        // displayOrder: 4,
    },
    {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8).getTime(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 9, 0, 0).getTime(),
        name: trans('gantee.exampleDeveloping'),
        id: "Task 3",
        progress: 2,
        dependencies: ["Task 2"],
        type: "task",
        project: "ProjectSample",
        // displayOrder: 5,
    },
    {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8).getTime(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10).getTime(),
        name: trans('gantee.exampleReview'),
        id: "Task 4",
        type: "task",
        progress: 70,
        dependencies: ["Task 2"],
        project: "ProjectSample",
        // displayOrder: 6,
    },
    {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).getTime(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).getTime(),
        name: trans('gantee.exampleRelease'),
        id: "Task 6",
        progress: currentDate.getMonth(),
        type: "milestone",
        dependencies: ["Task 4"],
        project: "ProjectSample",
        // displayOrder: 7,
    },
    {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5).getTime(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 19).getTime(),
        name: trans('gantee.exampleProject', { i: '2' }),
        id: "ProjectSample2",
        progress: 25,
        type: "project",
        hideChildren: false,
        // displayOrder: 8,
    },
    {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5).getTime(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10, 12, 28).getTime(),
        name: trans('gantee.exampleDeveloping'),
        id: "task100",
        progress: 45,
        type: "task",
        project: "ProjectSample2",
        // displayOrder: 9,
    },
    {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8).getTime(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 0, 0).getTime(),
        name: trans('gantee.exampleRelease'),
        id: "Task101",
        progress: 25,
        dependencies: ["task100"],
        type: "task",
        project: "ProjectSample2",
        // displayOrder: 10,
    },
]
export const stylingOptionZH = `{
    headerHeight: 50, //标题栏的高度
    hourColumnWidth: 65,//小时视图任务栏宽度
    quarterDayColumnWidth: 65,//1/4天视图任务栏宽度
    halfDayColumnWidth: 65,//1/2天视图任务栏宽度
    DayColumnWidth: 65,//日视图任务栏宽度
    weekColumnWidth: 250,//周视图任务栏宽度
    monthColumnWidth: 300,//月视图任务栏宽度
    yearColumnWidth: 365,//年视图任务栏宽度
    rowHeight: 50, //行高度
    barCornerRadius: 2, //任务条圆角半径
    barFill: 50, //任务条占用百分比
    handleWidth: 2, // 任务条拖动事件按钮宽度
    //fontFamily: Arial, // 字体
    fontSize: '12px', // 字体大小
    barProgressColor: #a3a3ff, // 进度条填充颜色
    barProgressSelectedColor: #8282f5, //进度条选择后颜色
    barBackgroundColor: #b8c2cc, // 进度条背景颜色
    barBackgroundSelectedColor: #b8c2cc, // 进度条背景颜色
    arrowColor: #808080,	// 箭头颜色
    arrowIndent: 20,	//箭头缩进距离
    todayColor: #7db59a	// 当日颜色
}`

export const stylingOptionEN = `{
    headerHeight: 50, //Specifies the header height.
    hourColumnWidth: 65,//Specifies the hour viewMode Column width.
    quarterDayColumnWidth: 65,//Specifies the quarterDay viewMode Column width.
    halfDayColumnWidth: 65,//Specifies the halfDay viewMode Column width.
    DayColumnWidth: 65,//Specifies the Day viewMode Column width.
    weekColumnWidth: 250,//Specifies the week viewMode Column width.
    monthColumnWidth: 300,//Specifies the month viewMode Column width.
    yearColumnWidth: 365,//Specifies the year viewMode Column width.
    rowHeight: 50, //Specifies the task row height.
    barCornerRadius: 2, //Specifies the taskbar corner rounding.
    barFill: 50, //Specifies the taskbar occupation.
    handleWidth: 2, //Specifies width the taskbar drag event control for start and end dates.
    //fontFamily: Arial, // Specifies the application font.
    fontSize: '12px', // Specifies the application font size.
    barProgressColor: #a3a3ff, // Specifies the taskbar progress fill color globally.
    barProgressSelectedColor: #8282f5, //Specifies the taskbar progress fill color globally on select.
    barBackgroundColor: #b8c2cc, // Specifies the taskbar background fill color globally.
    barBackgroundSelectedColor: #b8c2cc, // Specifies the taskbar background fill color globally on select.
    arrowColor: #808080,	// Specifies the relationship arrow fill color.
    arrowIndent: 20,	//Specifies the relationship arrow right indent. Sets in px
    todayColor: #7db59a	// Specifies the current period column fill color.
}`