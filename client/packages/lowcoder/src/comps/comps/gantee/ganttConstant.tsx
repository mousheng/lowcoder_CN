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

const exampleDate = dayjs()
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
            start_date: exampleDate.add(-5, 'd').format('YYYY-MM-DD'),
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
            start_date: exampleDate.add(3, 'd').format('YYYY-MM-DD'),
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
            start_date: exampleDate.add(-3, 'd').format('YYYY-MM-DD'),
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
            start_date: exampleDate.format('YYYY-MM-DD'),
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

export const zoomConfig = {
    levels: [
        {
            name: "hour",
            scale_height: 50,
            min_column_width: 80,
            scales: [
                { unit: "day", format: trans('gantt.hourScalesFormat') },
                { unit: "hour", step: 1, format: "%H:%i" }
            ]
        },
        {
            name: "day",
            scale_height: 27,
            min_column_width: 80,
            scales: [
                { unit: "day", step: 1, format: trans('gantt.dayScalesFormat') }
            ]
        },
        {
            name: "week",
            scale_height: 50,
            min_column_width: 50,
            scales: [
                {
                    unit: "week", step: 1, format: function (date: Date) {
                        var dateToStr = gantt.date.date_to_str(trans('gantt.weekScalesFormat1'));
                        var endDate = gantt.date.add(date, -6, "day");
                        var weekNum = gantt.date.date_to_str("%W")(date);
                        return "#" + weekNum + ", " + dateToStr(date).replace('月', '') + " - " + dateToStr(endDate).replace('月', '');
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
                        var dateToStr = gantt.date.date_to_str("%M");
                        var endDate = gantt.date.add(gantt.date.add(date, 3, "month"), -1, "day");
                        return dateToStr(date) + " - " + dateToStr(endDate);
                    }
                }
            ]
        },
        {
            name: "year",
            scale_height: 50,
            min_column_width: 30,
            scales: [
                { unit: "year", step: 1, format: "%Y" }
            ]
        }
    ]
};