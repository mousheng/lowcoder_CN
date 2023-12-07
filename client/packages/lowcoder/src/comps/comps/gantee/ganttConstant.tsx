import _ from 'lodash'
import { GanttStatic, gantt } from 'dhtmlx-gantt';
import { trans } from '@lowcoder-ee/i18n';
import { BoolControl, ExposeMethodCompConstructor, MethodConfigInfo, MultiBaseComp, MultiCompBuilder, RefControl, StringControl, ToInstanceType } from '@lowcoder-ee/index.sdk';
import { alignControl } from "comps/controls/alignControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { withDefault } from "../../generators";
import { CodeTextControl } from "@lowcoder-ee/index.sdk";
import dayjs from "dayjs"

export const ganttCommonChildren = {
    viewRef: RefControl<GanttStatic>,
    containerRef: RefControl<HTMLDivElement>,
};

type GanttCompType = ExposeMethodCompConstructor<
    MultiBaseComp<ToInstanceType<typeof ganttCommonChildren>>
>;

export function ganttMethods(): MethodConfigInfo<GanttCompType>[] {
    return [
        {
            method: {
                name: "addTask",
                description: trans("gantt.addTask"),
                params: [{ name: trans("gantt.taskObject"), type: "JSONValue", description: trans("gantt.taskObject") }],
            },
            execute: (comp, params) => {
                if (params.length) {
                    if (Array.isArray(params[0])) {
                        params[0].map(i => gantt.addTask(i))
                    } else if (typeof (params[0]) === 'object') {
                        gantt.addTask(params[0])
                    } else {
                        gantt.message({
                            text: trans('gantt.addTaskFail'),
                            type: "error",
                        });
                    }
                }
            },
        },
        {
            method: {
                name: "removeTask",
                description: trans("gantt.removeTask"),
                params: [{ name: trans("gantt.taskID"), type: "arrayString", description: trans("gantt.taskIDDesc") }],
            },
            execute: (comp, params) => {
                if (params.length) {
                    if (Array.isArray(params[0])) {
                        params[0].map(i => gantt.deleteTask(i as string))
                    } else if (typeof (params[0]) === 'string' && params[0].length > 0) {
                        gantt.deleteTask(params[0])
                    } else {
                        gantt.message({
                            text: trans('gantt.removeTaskFail'),
                            type: "error",
                        });
                    }
                }
            },
        },
        {
            method: {
                name: "addLink",
                description: trans("gantt.addLink"),
                params: [{ name: trans("gantt.linkObject"), type: "JSONValue", description: trans("gantt.linkObject") }],
            },
            execute: (comp, params) => {
                if (params.length) {
                    if (Array.isArray(params[0])) {
                        params[0].map(i => gantt.addLink(i))
                    } else if (typeof (params[0]) === 'object') {
                        gantt.addLink(params[0])
                    } else {
                        gantt.message({
                            text: trans('gantt.addLinkFail'),
                            type: "error",
                        });
                    }
                }
            },
        },
        {
            method: {
                name: "removeLink",
                description: trans("gantt.removeLink"),
                params: [{ name: trans("gantt.linkID"), type: "arrayString", description: trans("gantt.linkIDDesc") }],
            },
            execute: (comp, params) => {
                if (params.length) {
                    if (Array.isArray(params[0])) {
                        params[0].map(i => gantt.deleteLink(i as string))
                    } else if (typeof (params[0]) === 'string' && params[0].length > 0) {
                        gantt.deleteLink(params[0])
                    } else {
                        gantt.message({
                            text: trans('gantt.removeLinkFail'),
                            type: "error",
                        });
                    }
                }
            },
        },
        {
            method: {
                name: "expandingAll",
                description: trans("gantt.expandingAll"),
                params: [],
            },
            execute: () => {
                gantt.eachTask(function (task) {
                    task.$open = true;
                });
                gantt.render();
            },
        },
        {
            method: {
                name: "collapsingAll",
                description: trans("gantt.collapsingAll"),
                params: [],
            },
            execute: () => {
                gantt.eachTask(function (task) {
                    task.$open = false;
                });
                gantt.render();
            },
        },
        {
            method: {
                name: "exportToPNG",
                description: trans("gantt.exportToPNG"),
                params: [],
            },
            execute: (comp) => {
                gantt.exportToPNG()
            },
        },
        {
            method: {
                name: "exportToPDF",
                description: trans("gantt.exportToPDF"),
                params: [],
            },
            execute: (comp) => {
                gantt.exportToPDF()
            },
        },
        {
            method: {
                name: "exportToExcel",
                description: trans("gantt.exportToExcel"),
                params: [],
            },
            execute: (comp) => {
                gantt.exportToExcel()
            },
        },
    ];
}

export const cloumnsTypeOptions = [
    { label: trans('gantt.text'), value: "text" },
    { label: trans('gantt.progress'), value: "progress" },
    { label: trans('gantt.add'), value: "add" },
] as const;

export const skinsOptions = [
    { label: 'default', value: "./skins/dhtmlxgantt.css" },
    { label: 'skyblue', value: "./skins/dhtmlxgantt_skyblue.css" },
    { label: 'terrace', value: "./skins/dhtmlxgantt_terrace.css" },
    { label: 'broadway', value: "./skins/dhtmlxgantt_broadway.css" },
    { label: 'contrast_white', value: "./skins/dhtmlxgantt_contrast_white.css" },
    { label: 'material', value: "./skins/dhtmlxgantt_material.css" },
    { label: 'meadow', value: "./skins/dhtmlxgantt_meadow.css" },
] as const;

export const viewModeOptions = [
    { label: trans("gantt.hour"), value: 'hour' },
    { label: trans("gantt.day"), value: 'day' },
    { label: trans("gantt.week"), value: 'week' },
    { label: trans("gantt.month"), value: 'month' },
    { label: trans("gantt.quarter"), value: 'quarter' },
    { label: trans("gantt.year"), value: 'year' },
] as const;

export const scaleMode = [
    { label: trans("gantt.fit"), value: 'fit' },
    { label: trans("gantt.manual"), value: 'manual' },
] as const;

export const ColumnsOption = new MultiCompBuilder(
    {
        align: alignControl(),
        name: StringControl,
        label: StringControl,
        tree: BoolControl,
        ColumnsType: dropdownControl(cloumnsTypeOptions, 'text'),
        width: withDefault(CodeTextControl, '*'),
        hide: BoolControl,
    },
    (props) => props
).setPropertyViewFn((children) => (
    <>
        {children.ColumnsType.propertyView({ label: trans("gantt.ColumnsType") })}
        {children.ColumnsType.getView() === 'text' && children.name.propertyView({ label: trans("gantt.key") })}
        {children.ColumnsType.getView() !== 'add' && children.label.propertyView({ label: trans("gantt.title") })}
        {children.tree.propertyView({ label: trans("gantt.tree") })}
        {children.width.propertyView({ label: trans("gantt.width") })}
        {children.align.propertyView({
            label: trans("textShow.horizontalAlignment"),
            radioButton: true,
        })}
        {children.hide.propertyView({ label: trans("floatButton.hidden") })}
    </>
))
    .build();

const exampleDate = dayjs().startOf('day');
export const tasks =
    [
        {
            id: "A1",
            text: trans("gantt.projectText", { i: 1 }),
            progress: 0.7,
            showCode: 1,
            code: 0.1,
            task_user: "A",
            parent: 0,
            other: trans('gantt.otherData', { i: 1 }),
            color: '#46ad51',
        },
        {
            id: "A2",
            text: trans("gantt.taskText", { i: 1 }),
            start_date: exampleDate.add(-5, 'd').format('YYYY-MM-DDTHH:mm:ss'),
            duration: 4,
            progress: 1,
            parent: "A1",
            showCode: 1.1,
            code: 0.1,
            task_user: "A",
            other: trans('gantt.otherData', { i: 2 }),
        },
        {
            id: "A3",
            text: trans("gantt.taskText", { i: 2 }),
            start_date: exampleDate.add(3, 'd').format('YYYY-MM-DDTHH:mm:ss'),
            progress: 0,
            parent: "A1",
            pre_task: "A2",
            showCode: 1.2,
            code: 0.2,
            type: 'milestone',
            other: trans('gantt.otherData', { i: 3 }),
        },
        {
            id: "A4",
            text: trans("gantt.projectText", { i: 2 }),
            progress: 0.6,
            showCode: 1,
            code: 0.1,
            task_user: "A",
            parent: 0,
            other: trans('gantt.otherData', { i: 4 }),
            color: '#46ad51',
        },
        {
            id: "A5",
            text: trans("gantt.taskText", { i: 1 }),
            start_date: exampleDate.add(-3, 'd').format('YYYY-MM-DDTHH:mm:ss'),
            duration: 5,
            progress: 0.7,
            showCode: 2,
            code: 0.2,
            task_user: "A",
            parent: 'A4',
            other: trans('gantt.otherData', { i: 5 }),
        },
        {
            id: "A6",
            text: trans("gantt.taskText", { i: 2 }),
            start_date: exampleDate.format('YYYY-MM-DDTHH:mm:ss'),
            duration: 6,
            progress: 0.1,
            showCode: 2,
            code: 0.2,
            task_user: "A",
            parent: 'A4',
            other: trans('gantt.otherData', { i: 6 }),
        }
    ]

export const links = [
    {
        "id": 1,
        "source": 'A2',
        "target": 'A3',
        "type": "0"
    },
    {
        "id": 2,
        "source": 'A5',
        "target": 'A6',
        "type": "0"
    },
]

function getQuarterFromDate(date: Date) {
    const month = date.getMonth();
    if (month >= 0 && month < 3) {
        return 1;
    } else if (month >= 3 && month < 6) {
        return 2;
    } else if (month >= 6 && month < 9) {
        return 3;
    } else {
        return 4;
    }
}

export const zoomConfig = {
    levels: [
        {
            name: "hour",
            scale_height: 50,
            min_column_width: 20,
            scales: [
                { unit: "day", format: trans('gantt.hourScalesFormat') },
                { unit: "hour", step: 1, format: "%G" }
            ]
        },
        {
            name: "day",
            scale_height: 27,
            min_column_width: 55,
            scales: [
                { unit: "day", step: 1, format: trans('gantt.dayScalesFormat') }
            ]
        },
        {
            name: "week",
            scale_height: 50,
            min_column_width: 70,
            scales: [
                {
                    unit: "week", step: 1, format: function (date: Date) {
                        var dateToStr = gantt.date.date_to_str(trans('gantt.weekScalesFormat1'));
                        var endDate = gantt.date.add(date, 6, "day");
                        var weekNum = gantt.date.date_to_str("%W")(date);
                        return trans('gantt.weekScale', { i: weekNum }) + dateToStr(date).replace('月', '') + " - " + dateToStr(endDate).replace('月', '');
                    }
                },
                { unit: "day", step: 1, format: trans('gantt.weekScalesFormat2') }
            ]
        },
        {
            name: "month",
            scale_height: 50,
            min_column_width: 120,
            scales: [
                { unit: "month", format: trans('gantt.monthScalesFormat1') },
                { unit: "week", format: trans('gantt.monthScalesFormat2') },
            ]
        },
        {
            name: "quarter",
            scale_height: 50,
            min_column_width: 90,
            scales: [
                { unit: "month", step: 1, format: "%M" },
                {
                    unit: "quarter", step: 1, format: function (date: Date) {
                        var year = gantt.date.date_to_str("%Y");
                        var quarter = getQuarterFromDate(date);
                        return trans('gantt.quarterScalesFormat', { y: year(date), i: quarter, });
                    }
                }
            ]
        },
        {
            name: "year",
            scale_height: 50,
            min_column_width: 30,
            scales: [
                { unit: "year", step: 1, format: trans('gantt.yearScalesFormat') }
            ]
        }
    ]
};

export type StatutoryHolidaysDataType = typeof StatutoryHolidaysData

export const StatutoryHolidaysData = [
    { "date": "2024-01-01", "holiday": true },   // 元旦
    { "date": "2024-02-04", "holiday": false },  // 上班
    { "date": "2024-02-10", "holiday": true },   // 春节
    { "date": "2024-02-11", "holiday": true },
    { "date": "2024-02-12", "holiday": true },
    { "date": "2024-02-13", "holiday": true },
    { "date": "2024-02-14", "holiday": true },
    { "date": "2024-02-15", "holiday": true },
    { "date": "2024-02-16", "holiday": true },
    { "date": "2024-02-17", "holiday": true },
    { "date": "2024-02-18", "holiday": false },  // 春节调休上班
    { "date": "2024-04-04", "holiday": true },   // 清明节
    { "date": "2024-04-05", "holiday": true },
    { "date": "2024-04-06", "holiday": true },
    { "date": "2024-04-07", "holiday": false },  // 清明节调休上班
    { "date": "2024-04-28", "holiday": false },  // 劳动节调休上班
    { "date": "2024-05-01", "holiday": true },   // 劳动节
    { "date": "2024-05-02", "holiday": true },
    { "date": "2024-05-03", "holiday": true },
    { "date": "2024-05-04", "holiday": true },
    { "date": "2024-05-05", "holiday": true },
    { "date": "2024-05-11", "holiday": false },
    { "date": "2024-06-10", "holiday": true },   // 端午节
    { "date": "2024-09-15", "holiday": true },   // 中秋节
    { "date": "2024-09-16", "holiday": true },
    { "date": "2024-09-17", "holiday": true },
    { "date": "2024-09-14", "holiday": false },  // 中秋节调休上班
    { "date": "2024-09-29", "holiday": false },  // 国庆节调休上班
    { "date": "2024-10-01", "holiday": true },   // 国庆节
    { "date": "2024-10-02", "holiday": true },
    { "date": "2024-10-03", "holiday": true },
    { "date": "2024-10-04", "holiday": true },
    { "date": "2024-10-05", "holiday": true },
    { "date": "2024-10-06", "holiday": true },
    { "date": "2024-10-07", "holiday": true },
    { "date": "2024-10-12", "holiday": false }
]

export const taskDataDescZh = (
    <li>
        接受对象数组，具体可参考<a href='https://docs.dhtmlx.com/gantt/desktop__task_properties.html'>任务属性（部分不支持）</a>，对象可包含以下属性：
        <br />
        id (string or number): 任务的唯一标识符，可以是字符串或数字。
        <br />
        start_date (Date): 任务的开始日期。
        <br />
        end_date (Date): 任务的结束日期。
        <br />
        text (string): 任务的显示文本。
        <br />
        progress (number): 任务完成的百分比。
        <br />
        duration (number): 任务的持续时间，以时间单位（例如天）表示。
        <br />
        parent (string or number): 如果任务是子任务，则指定父任务的id。
        <br />
        type (string): 任务的类型，例如project、task或milestone。
        <br />
        open (boolean): 指示任务是否展开显示其子任务。
        <br />
        color (string): 任务的颜色。
        <br />
        textColor (string): 任务文本的颜色。
        <br />
        progressColor (string): 任务进度条的颜色。
        <br />
        readonly (boolean): 指示任务是否为只读。
        <br />
    </li>
);

export const taskDataDescEn = (<li>
    Accepts an array of objects,For specific details, please refer to here<a href='https://docs.dhtmlx.com/gantt/desktop__task_properties.html'>Task Properties (Some Not Supported)</a>, where each object can include the following properties:
    <br />
    id (string or number): A unique identifier for the task, can be a string or number.
    <br />
    start_date (Date): The start date of the task.
    <br />
    end_date (Date): The end date of the task.
    <br />
    text (string): The display text of the task.
    <br />
    progress (number): The percentage of completion for the task.
    <br />
    duration (number): The duration of the task, represented in time units (e.g., days).
    <br />
    parent (string or number): If the task is a subtask, specifies the id of the parent task.
    <br />
    type (string): The type of the task, such as project, task, or milestone.
    <br />
    open (boolean): Indicates whether the task should be expanded to show its subtasks.
    <br />
    color (string): The color of the task.
    <br />
    textColor (string): The color of the task text.
    <br />
    progressColor (string): The color of the task progress bar.
    <br />
    readonly (boolean): Indicates whether the task is read-only.
    <br />
</li>
)

export const LinkDataDescZh = (
    <li>
        接受对象数组，具体可参考<a href='https://docs.dhtmlx.com/gantt/desktop__link_properties.html'>任务属性（部分不支持）</a>，对象可包含以下属性：
        <br />
        id (string or number): 任务的唯一标识符，可以是字符串或数字。
        <br />
        id (string or number): 链接的唯一标识符。
        <br />
        source (string or number): 链接的起始任务的id。
        <br />
        target (string or number): 链接的目标任务的id。
        <br />
        color (string): 链接的颜色。
        <br />
        type (string): 链接的类型。
        <br />
        &nbsp;&nbsp;0:终-起连线
        <br />
        &nbsp;&nbsp;1:起-起连线
        <br />
        &nbsp;&nbsp;2:终-终连线
        <br />
        &nbsp;&nbsp;3:起-始连线
        <br />
        readonly (boolean): 指示链接是否为只读。
    </li>
);

export const LinkDataDescEn = (
    <li>
        Accepts an array of objects,For specific details, please refer to here<a href='https://docs.dhtmlx.com/gantt/desktop__link_properties.html'>Task Properties (Some Not Supported)</a>, where each object can include the following properties:
        <br />
        ID (string or number): The unique identifier of the link.
        <br />
        Source (string or number): The ID of the starting task of the link.
        <br />
        Target (string or number): The ID of the target task of the link.
        <br />
        Color (string): The color of the link.
        <br />
        Type (string): The type of link.
        <br />
        &nbsp;&nbsp;0: End Start Connection
        <br />
        &nbsp;&nbsp;1: Start up connection
        <br />
        &nbsp;&nbsp;2: End to End Connection
        <br />
        &nbsp;&nbsp;3: Starting and Starting Lines
        <br />
        Readonly (boolean): Indicates whether the link is read-only.
    </li>
);