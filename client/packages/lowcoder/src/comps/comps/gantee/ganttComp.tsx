import { CompAction, RecordConstructorToView, changeChildAction } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { arrayObjectExposingStateControl } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
import { GanttStyle, GanttStyleType } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { changeEvent, addedLinkEvent, eventHandlerControl, deletedLinkEvent, ProgressDragEvent, selectedChangeEvent, addTaskEvent, TaskChangeEvent } from "../../controls/eventHandlerControl";
import styled from "styled-components";
import { useEffect, useRef, useState } from "react";
import { gantt } from 'dhtmlx-gantt';
import { ColumnsOption, links, tasks, viewModeOptions, zoomConfig, ganttMethods, skinsOptions, StatutoryHolidaysData, StatutoryHolidaysDataType } from "./ganttConstant";
import { NumberControl, StringOrNumberControl, jsonObjectControl, manualOptionsControl, valueComp, withDefault } from "@lowcoder-ee/index.sdk";
import _ from "lodash"

const Container = styled.div<{ $style: GanttStyleType | undefined }>`
  height: 100%;
  width: 100%;
  .gantt_task_line.low_task {
    background-color: ${props => props.$style?.progressLowBg};
    border: 1px solid ${props => props.$style?.progressLowColor};
    .gantt_task_progress {
      background: ${props => props.$style?.progressLowColor};
    }
  }
  .Medium_task {
    background-color: ${props => props.$style?.progressMediumBg};
    border: 1px solid ${props => props.$style?.progressMediumColor};
    .gantt_task_progress {
      background: ${props => props.$style?.progressMediumColor};
    }
  }
  .High_task {
    background-color: ${props => props.$style?.progressHighBg};
    border: 1px solid ${props => props.$style?.progressHighColor};
    .gantt_task_progress {
      background: ${props => props.$style?.progressHighColor};
    }
  }
  .completed_task {
    border: 1px solid ${props => props.$style?.progresscompletedColor};
    .gantt_task_progress {
      background: ${props => props.$style?.progresscompletedColor};
    }
  }
  .gantt_task_link.start_to_start .gantt_line_wrapper div {
    background-color: ${props => props.$style?.link_s2s};
  }

  .gantt_task_link.start_to_start:hover .gantt_line_wrapper div {
    box-shadow: 0 0 5px 0px ${props => props.$style?.link_s2s};
  }

  .gantt_task_link.start_to_start .gantt_link_arrow_right {
    border-left-color: ${props => props.$style?.link_s2s};
  }

  .gantt_task_link.finish_to_start .gantt_line_wrapper div {
    background-color: ${props => props.$style?.link_f2s};
  }

  .gantt_task_link.finish_to_start:hover .gantt_line_wrapper div {
    box-shadow: 0 0 5px 0px ${props => props.$style?.link_f2s};
  }

  .gantt_task_link.finish_to_start .gantt_link_arrow_right {
    border-left-color: ${props => props.$style?.link_f2s};
  }

  .gantt_task_link.finish_to_finish .gantt_line_wrapper div {
    background-color: ${props => props.$style?.link_f2f};
  }

  .gantt_task_link.finish_to_finish:hover .gantt_line_wrapper div {
    box-shadow: 0 0 5px 0px ${props => props.$style?.link_f2f};
  }

  .gantt_task_link.finish_to_finish .gantt_link_arrow_left {
    border-right-color: ${props => props.$style?.link_f2f};
  }
  .gantt_task_cell.week_end {
    background-color: ${props => props.$style?.weekend};
  }

  .gantt_task_row.gantt_selected .gantt_task_cell.week_end {
    background-color: ${props => props.$style?.weekendSelected};
  }

  .gantt_task_cell.no_work_hour {
    background-color: ${props => props.$style?.noWorkHour};
  }

  .gantt_task_row.gantt_selected .gantt_task_cell.no_work_hour {
    background-color: ${props => props.$style?.noWorkHourSelected};
  }
`;

const EventOptions = [selectedChangeEvent, addTaskEvent] as const;

const GanttColumns = manualOptionsControl(ColumnsOption, {
  initOptions: [
    { name: 'text', label: trans('gantt.project'), align: 'center', tree: true, width: '120' },
    { name: 'start_date', label: trans('gantt.from'), align: 'center' },
    { name: 'progress', label: trans('gantt.progress'), align: 'center', ColumnsType: 'progress' },
    { name: 'duration', label: trans('gantt.duration'), align: 'center', ColumnsType: 'progress' },
    { name: 'add', label: '+', align: 'center', ColumnsType: 'add' },
  ],
  uniqField: "name",
});

const childrenMap = {
  tasks: arrayObjectExposingStateControl('tasks', tasks),
  links: arrayObjectExposingStateControl('links', links),
  level: dropdownControl(viewModeOptions, 'day'),
  durationUnit: dropdownControl([{ label: trans("gantt.minute"), value: 'minute' }, ...viewModeOptions], 'day'),
  Columns: GanttColumns,
  showColumns: BoolControl.DEFAULT_TRUE,
  allowTaskDrag: BoolControl,
  allowProjectDrag: BoolControl,
  onChangeEvent: eventHandlerControl([changeEvent]),
  allowLinkDelete: BoolControl,
  onDeletedLinkEvent: eventHandlerControl([deletedLinkEvent]),
  allowAddLink: BoolControl,
  onAddedLinkEvent: eventHandlerControl([addedLinkEvent]),
  allowProgressDrag: BoolControl,
  onProgressDragEvent: eventHandlerControl([ProgressDragEvent]),
  allowTaskChange: BoolControl,
  onTaskChangeEvent: eventHandlerControl([TaskChangeEvent]),
  showToday: BoolControl.DEFAULT_TRUE,
  style: styleControl(GanttStyle),
  currentId: StringOrNumberControl,
  onEvent: eventHandlerControl(EventOptions),
  currentObject: valueComp({}),
  openAllBranchInit: BoolControl,
  skins: dropdownControl(skinsOptions, './skins/dhtmlxgantt.css'),
  AutoCalculateProgress: BoolControl,
  SegmentedColor: BoolControl,
  lowLine: withDefault(NumberControl, 0.2),
  mediumLine: withDefault(NumberControl, 0.5),
  showHolidays: BoolControl,
  StatutoryHolidays: arrayObjectExposingStateControl('StatutoryHolidays', StatutoryHolidaysData),
  showWorkTimes: BoolControl,
  workTimeData: jsonObjectControl({ hours: ['8:00-12:00', '14:00-17:00'] }),
};

const GanttView = (props: RecordConstructorToView<typeof childrenMap> & {
  dispatch: (action: CompAction) => void;
}) => {
  const conRef = useRef<HTMLDivElement>(null);
  const [handleDBClickLinkRef, sethandleDBClickLinkRef] = useState('')
  const [handleDBClickTaskRef, sethandleDBClickTaskRef] = useState('')
  const [handleParseRef, sethandleParseRef] = useState('')
  const [handleAfterTaskUpdateRef, sethandleAfterTaskUpdateRef] = useState('')
  const [handleTaskDragRef, sethandleTaskDragRef] = useState('')
  const [handleAfterTaskAddRef, sethandleAfterTaskAddRef] = useState('')
  const [handleBeforeTaskDeleteRef, sethandleBeforeTaskDeleteRef] = useState('')
  const [handleAfterTaskDeleteRef, sethandleAfterTaskDeleteRef] = useState('')
  const [markId, setMarkId] = useState('')
  const [initFlag, setInitFlag] = useState(false)
  var idParentBeforeDeleteTask: taskType = 0;

  type taskType = number | string
  // 计算总进度
  function calculateSummaryProgress(task: any) {
    if (task.type != gantt.config.types.project)
      return task.progress;
    var totalToDo = 0;
    var totalDone = 0;
    gantt.eachTask(function (child) {
      if (child.type != gantt.config.types.project) {
        totalToDo += child.duration;
        totalDone += (child.progress || 0) * child.duration;
      }
    }, task.id);
    if (!totalToDo) return 0;
    else return totalDone / totalToDo;
  }
  // 刷新总进度
  function refreshSummaryProgress(id: taskType, submit: any) {
    if (!gantt.isTaskExists(id))
      return;

    var task = gantt.getTask(id);
    var newProgress = calculateSummaryProgress(task);

    if (newProgress !== task.progress) {
      task.progress = newProgress;

      if (!submit) {
        gantt.refreshTask(id);
      } else {
        gantt.updateTask(id);
      }
    }

    if (!submit && gantt.getParent(id) !== gantt.config.root_id) {
      refreshSummaryProgress(gantt.getParent(id), submit);
    }
  }
  useEffect(() => {
    // 设置 任务的 class 类名
    gantt.templates.task_class = (start, end, task) => {
      if (!props.SegmentedColor) return ""
      if (task.progress && task.progress <= Math.min(props.lowLine, props.mediumLine)) return "low_task";
      if (task.progress && task.progress <= Math.max(props.lowLine, props.mediumLine)) return "Medium_task";
      if (task.progress && task.progress < 1) return "High_task";
      if (task.progress === 1) return "completed_task";
      return "";
    }
    gantt.render();
  }, [props.lowLine, props.mediumLine, props.SegmentedColor])
  // 设置四种连接线的类型
  useEffect(() => {
    gantt.templates.link_class = function (link) {
      var types = gantt.config.links;
      switch (link.type) {
        case types.finish_to_start:
          return "finish_to_start";
        case types.start_to_start:
          return "start_to_start";
        case types.finish_to_finish:
          return "finish_to_finish";
        default:
          return "start_to_finish";
      }
    };
    gantt.render()
  }, [props.style.link_f2f, props.style.link_f2s, props.style.link_s2f, props.style.link_s2s])
  // 添加、删除回调事件
  function setAutoCalculateCallBack() {
    handleParseRef && gantt.detachEvent(handleParseRef)
    sethandleParseRef(gantt.attachEvent("onParse", function () {
      gantt.eachTask(function (task) {
        props.AutoCalculateProgress && (task.progress = calculateSummaryProgress(task))
      });
    }))

    handleAfterTaskUpdateRef && gantt.detachEvent(handleAfterTaskUpdateRef)
    sethandleAfterTaskUpdateRef(gantt.attachEvent("onAfterTaskUpdate", function (id) {
      props.AutoCalculateProgress && refreshSummaryProgress(gantt.getParent(id), true);
    }))

    handleTaskDragRef && gantt.detachEvent(handleTaskDragRef)
    sethandleTaskDragRef(gantt.attachEvent("onTaskDrag", function (id) {
      if (props.AutoCalculateProgress) {
        refreshSummaryProgress(gantt.getParent(id), false);
      }
    }))

    handleAfterTaskAddRef && gantt.detachEvent(handleAfterTaskAddRef)
    sethandleAfterTaskAddRef(gantt.attachEvent("onAfterTaskAdd", function (id) {
      props.AutoCalculateProgress && refreshSummaryProgress(gantt.getParent(id), true);
    }))

    handleBeforeTaskDeleteRef && gantt.detachEvent(handleBeforeTaskDeleteRef)
    sethandleBeforeTaskDeleteRef(gantt.attachEvent("onBeforeTaskDelete", function (id) {
      idParentBeforeDeleteTask = gantt.getParent(id);
    }))

    handleAfterTaskDeleteRef && gantt.detachEvent(handleAfterTaskDeleteRef)
    sethandleAfterTaskDeleteRef(gantt.attachEvent("onAfterTaskDelete", function () {
      props.AutoCalculateProgress && refreshSummaryProgress(idParentBeforeDeleteTask, true);
    }))
  }

  function setStatutoryHolidays() {
    Array.isArray(props.StatutoryHolidays.value) && (props.StatutoryHolidays.value as StatutoryHolidaysDataType).map((d) => {
      gantt.setWorkTime({ date: new Date(d.date), hours: !d.holiday })
    })
  }

  useEffect(() => {
    gantt.config.work_time = props.showHolidays;
    gantt.templates.timeline_cell_class = function (task, date) {
      var css = [];
      if (!gantt.isWorkTime(date, 'day') && ['day', 'hour', 'week'].includes(props.level)) {
        css.push("week_end");
      } else if (props.showWorkTimes && !gantt.isWorkTime(date, 'hour') && props.level === 'hour') {
        css.push("no_work_hour");
      }
      return css.join(" ");
    };
    if (props.showHolidays) {
      setStatutoryHolidays()
    }
    if (props.showWorkTimes) {
      gantt.setWorkTime(props.workTimeData)
    }
    gantt.render();
  }, [props.showHolidays, props.StatutoryHolidays.value, props.level, props.showWorkTimes, props.workTimeData])


  useEffect(() => {
    gantt.config.duration_unit = props.durationUnit;
    initGantt();
  }, [props.durationUnit])

  // 切换主题
  useEffect(() => {
    import(props.skins)
  }, [props.skins])
  // 设置是否允许拖动项目
  useEffect(() => {
    gantt.config.drag_project = props.allowProjectDrag;
  }, [props.allowProjectDrag])
  useEffect(() => {
    gantt.config.show_grid = props.showColumns;
    gantt.render();
  }, [props.showColumns])
  // 设置是否自动计算进度
  useEffect(() => {
    setAutoCalculateCallBack()
    gantt.config.auto_types = props.AutoCalculateProgress;
  }, [props.AutoCalculateProgress])
  // 初始化
  useEffect(() => {
    gantt.ext.zoom.init(zoomConfig);
    gantt.clearAll()
    gantt.i18n.setLocale("cn");
    gantt.plugins({
      marker: true,
      drag_timeline: true,
      export_api: true,
    });
    // 取消原组件弹出框
    gantt.attachEvent(
      'onBeforeLightbox',
      function (id) {
        return false;
      },
      {}
    );
    // 任务拖动、进度条拖动后
    gantt.attachEvent("onAfterTaskDrag", function (id, mode, e) {
      props.dispatch(changeChildAction("currentId", id, false));
      props.dispatch(changeChildAction("currentObject",
        _.pickBy(gantt.getTask(id), (value, key) => !key.startsWith('$'))
        , false));
      if (mode === 'progress') {
        props.onProgressDragEvent('progressDrag')
      } else if (mode === 'move') {
        props.onChangeEvent('change')
      }
      return true;
    })
    // 链接添加后
    gantt.attachEvent("onAfterLinkAdd", function (id, item) {
      props.dispatch(changeChildAction("currentId", id, false));
      props.dispatch(changeChildAction("currentObject",
        _.pickBy(item, (value, key) => !key.startsWith('$'))
        , false));
      props.onAddedLinkEvent('addedLink')
    });
    // 删除链接时
    gantt.attachEvent("onAfterLinkDelete", function (id, item) {
      props.onDeletedLinkEvent('deletedLink')
    });
    // 创建新任务时
    gantt.attachEvent("onTaskCreated", function (item) {
      props.dispatch(changeChildAction("currentId", item.parent, false));
      props.onEvent('addTask')
      return false;
    });
    // 选择任务时
    gantt.attachEvent("onBeforeTaskSelected", function (id) {
      props.dispatch(changeChildAction("currentId", id, false));
      props.dispatch(changeChildAction("currentObject", _.pickBy(gantt.getTask(id), (value, key) => !key.startsWith('$')), false));
      props.onEvent('selectedChange')
      return true;
    });
    // 点击链接时
    gantt.attachEvent("onLinkClick", function (id, e) {
      props.dispatch(changeChildAction("currentId", id, false));
      props.dispatch(changeChildAction("currentObject", _.pickBy(gantt.getLink(id), (value, key) => !key.startsWith('$')), false));
      props.onEvent('selectedChange')
    });
    // 里程碑节点显示右侧文字
    gantt.templates.rightside_text = function (start, end, task) {
      if (task.type == gantt.config.types.milestone) {
        return task.text;
      }
      return "";
    };
  }, [])

  useEffect(() => {
    initGantt()
  }, [JSON.stringify(props.tasks.value), JSON.stringify(props.links.value)])

  // 是否显示今日标签
  useEffect(() => {
    props.showToday ? setMarkId(gantt.addMarker({
      start_date: new Date(),
      text: '今日'
    }))
      :
      gantt.deleteMarker(markId)
  }, [props.showToday])

  // 设置是否允许删除链接
  useEffect(() => {
    handleDBClickLinkRef && gantt.detachEvent(handleDBClickLinkRef)
    sethandleDBClickLinkRef(gantt.attachEvent("onLinkDblClick", function (id, e) {
      return props.allowLinkDelete;
    }))
  }, [props.allowLinkDelete])

  // 设置是否允许修改任务
  useEffect(() => {
    handleDBClickTaskRef && gantt.detachEvent(handleDBClickTaskRef)
    sethandleDBClickTaskRef(
      gantt.attachEvent("onTaskDblClick", function (id, e) {
        props.allowTaskChange && props.onTaskChangeEvent('TaskChange')
        return true;
      })
    )
  }, [props.allowTaskChange])

  // 设置允许添加链接
  useEffect(() => {
    gantt.config.drag_links = props.allowAddLink;
    gantt.render();
  }, [props.allowAddLink])

  // 设置允许拖动任务
  useEffect(() => {
    gantt.config.drag_move = props.allowTaskDrag;
    gantt.render()
  }, [props.allowTaskDrag])

  // 设置允许拖动进度
  useEffect(() => {
    gantt.config.drag_progress = props.allowProgressDrag;
    gantt.render()
  }, [props.allowProgressDrag])

  // 设置缩放等级
  useEffect(() => {
    gantt.ext.zoom.setLevel(props.level);
    gantt.render()
  }, [props.level])

  // 展开或关闭所有分支
  useEffect(() => {
    gantt.eachTask(function (task) {
      task.$open = props.openAllBranchInit;
    });
    gantt.render();
  }, [props.openAllBranchInit])

  // 设置左侧列表
  useEffect(() => {
    gantt.config.columns = props.Columns.map((c: any) => {
      let rt = { ...c }
      if ('ColumnsType' in c) {
        if (c.ColumnsType === 'progress') {
          rt['name'] = ''
          rt['template'] = (item: any) => {
            if (item?.type === "milestone") return '100%'
            return `${Math.round(item.progress * 100)}%`
          }
        } else if (c.ColumnsType === 'add') {
          rt['name'] = 'add'
          rt['label'] = ''
        }
      }
      return rt
    });
    gantt.render();
  }, [JSON.stringify(props.Columns)])

  const initGantt = () => {
    gantt.templates.parse_date = function (date) {
      return new Date(date);
    };
    gantt.config.open_tree_initially = props.openAllBranchInit;
    if (conRef.current) {
      if (!initFlag) {
        gantt.init(conRef.current)
      }
      setInitFlag(true)
      gantt.parse(_.cloneDeep({
        data: props.tasks.value,
        links: props.links.value,
      }));
    }
  }
  return (
    <Container
      ref={conRef}
      $style={props.style}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
    </Container>
  );
};

let GanttBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => <GanttView {...props} dispatch={dispatch} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.tasks.propertyView({
            label: trans("gantt.tasks"),
          })}
          {children.links.propertyView({
            label: trans("gantt.links"),
          })}
          {children.showColumns.propertyView({
            label: trans("gantt.showColumns"),
          })}
          {children.showColumns.getView() && children.Columns.propertyView({
            title: trans("gantt.ColumnsData"),
          })}
        </Section>
        <Section name={sectionNames.advanced}>
          {children.showToday.propertyView({
            label: trans("gantt.showTodayMark"),
          })}
          {children.showHolidays.propertyView({
            label: trans("gantt.showHolidays")
          })}
          {children.showHolidays.getView() && children.StatutoryHolidays.propertyView({
            label: trans("gantt.StatutoryHolidays")
          })}
          {children.level.propertyView({
            label: trans("gantt.level"),
          })}
          {children.durationUnit.propertyView({
            label: trans("gantt.durationUnit"),
          })}
          {children.level.getView() === 'hour' &&
            children.showHolidays.getView() &&
            children.showWorkTimes.propertyView({
              label: trans("gantt.showWorkTimes")
            })}
          {children.level.getView() === 'hour' &&
            children.showWorkTimes.getView() &&
            children.showHolidays.getView() &&
            children.workTimeData.propertyView({
              label: trans("gantt.workTimeData")
            })}
        </Section>
        <Section name={sectionNames.interaction}>
          {children.allowTaskChange.propertyView({
            label: trans("gantt.allowChangeTask"),
          })}
          {children.allowTaskChange.getView() && children.onTaskChangeEvent.propertyView({
            title: trans("gantt.handleTaskChange"),
          })}
          {children.allowTaskDrag.propertyView({
            label: trans("gantt.allowTaskDrag"),
          })}
          {children.allowTaskDrag.getView() && children.allowProjectDrag.propertyView({
            label: trans("gantt.allowProjectDrag"),
          })}
          {children.allowTaskDrag.getView() && children.onChangeEvent.propertyView({
            title: trans("gantt.handleDateChange"),
          })}
          {children.allowAddLink.propertyView({
            label: trans("gantt.allowAddLink"),
          })}
          {children.allowAddLink.getView() && children.onAddedLinkEvent.propertyView({
            title: trans("gantt.handleAddedLink"),
          })}
          {children.allowLinkDelete.propertyView({
            label: trans("gantt.allowLinkDelete"),
          })}
          {children.allowLinkDelete.getView() && children.onDeletedLinkEvent.propertyView({
            title: trans("gantt.handleDeletedLink"),
          })}
          {children.allowProgressDrag.propertyView({
            label: trans("gantt.allowProgressDrag"),
          })}
          {children.allowProgressDrag.getView() && children.AutoCalculateProgress.propertyView({
            label: trans("gantt.AutoCalculateProgress"),
          })}
          {children.allowProgressDrag.getView() && children.onProgressDragEvent.propertyView({
            title: trans("gantt.handleProgressDrag"),
          })}
        </Section>
        <Section name={sectionNames.layout}>
          {children.openAllBranchInit.propertyView({
            label: trans("gantt.openAllBranchInit")
          })}
          {children.onEvent.propertyView({
            title: trans("gantt.otherEvents"),
          })}
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.style}>
          {children.skins.propertyView({
            label: trans('gantt.skins')
          })}
          {children.SegmentedColor.propertyView({
            label: trans('gantt.SegmentedColor')
          })}
          {children.SegmentedColor.getView() && children.lowLine.propertyView({
            label: trans('gantt.lowProgressLine')
          })}
          {children.SegmentedColor.getView() && children.mediumLine.propertyView({
            label: trans('gantt.mediumProgressLine')
          })}
          {children.style.getPropertyView()}
        </Section>
      </>
    ))
    .setExposeMethodConfigs(ganttMethods() as any)
    .build();
})();

GanttBasicComp = class extends GanttBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const GanttComp = withExposingConfigs(GanttBasicComp, [
  new NameConfig("tasks", trans("gantt.tasks")),
  new NameConfig("links", trans("gantt.links")),
  new NameConfig("currentId", trans("gantt.currentId")),
  new NameConfig("currentObject", trans("gantt.currentObject")),
  NameConfigHidden,
]);
