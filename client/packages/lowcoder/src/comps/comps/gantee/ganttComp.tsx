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
import ReactResizeDetector from "react-resize-detector";
import { changeEvent, addedLinkEvent, eventHandlerControl, deletedLinkEvent, ProgressDragEvent, selectedChangeEvent, addTaskEvent } from "../../controls/eventHandlerControl";
import styled from "styled-components";
import { useEffect, useRef, useState } from "react";
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { ColumnsOption, links, tasks, viewModeOptions, zoomConfig, ganttMethods } from "./ganttConstant";
import { StringOrNumberControl, manualOptionsControl, valueComp } from "@lowcoder-ee/index.sdk";
import _ from "lodash"


const Container = styled.div<{ $style: GanttStyleType | undefined }>`
  height: 100%;
  width: 100%;
`;

const EventOptions = [selectedChangeEvent, addTaskEvent] as const;

const GanttColumns = manualOptionsControl(ColumnsOption, {
  initOptions: [
    { name: 'text', label: trans('gantt.project'), align: 'center', tree: true, width: '120' },
    { name: 'start_date', label: trans('gantt.from'), align: 'center' },
    { name: 'progress', label: trans('gantt.progress'), align: 'center', ColumnsType: 'progress' },
    { name: 'add', label: '+', align: 'center', ColumnsType: 'add' },
  ],
  uniqField: "name",
});

const childrenMap = {
  tasks: arrayObjectExposingStateControl('tasks', tasks),
  links: arrayObjectExposingStateControl('links', links),
  level: dropdownControl(viewModeOptions, 'day'),
  Columns: GanttColumns,
  allowTaskDrag: BoolControl,
  onChangeEvent: eventHandlerControl([changeEvent]),
  allowLinkDelete: BoolControl,
  onDeletedLinkEvent: eventHandlerControl([deletedLinkEvent]),
  allowAddLink: BoolControl,
  onAddedLinkEvent: eventHandlerControl([addedLinkEvent]),
  allowProgressDrag: BoolControl,
  onProgressDragEvent: eventHandlerControl([ProgressDragEvent]),
  showToday: BoolControl.DEFAULT_TRUE,
  style: styleControl(GanttStyle),
  currentId: StringOrNumberControl,
  onEvent: eventHandlerControl(EventOptions),
  currentObject: valueComp({}),
  openAllBranchInit: BoolControl,
};

const GanttView = (props: RecordConstructorToView<typeof childrenMap> & {
  dispatch: (action: CompAction) => void;
}) => {
  const conRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [handleDBClickLinkRef, sethandleDBClickLinkRef] = useState('')
  const [markId, setMarkId] = useState('')
  const [initFlag, setInitFlag] = useState(false)
  useEffect(() => {
    gantt.i18n.setLocale("cn");
    gantt.plugins({
      marker: true,
      drag_timeline: true,
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
    gantt.ext.zoom.init(zoomConfig);
    setTimeout(() => {
      gantt.ext.zoom.setLevel(props.level);
      gantt.render()
    }, 100);
  }, [props.level])

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

  useEffect(() => {
    if (height && width) {
      onResize();
    }
  }, [height, width]);

  const onResize = () => {
    const container = conRef.current;
    setWidth(container?.clientWidth ?? 0);
    setHeight(container?.clientHeight ?? 0);
  };

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
  props.dispatch(changeChildAction("ganttRef", gantt, false));
  return (
    <ReactResizeDetector onResize={onResize}>
      <Container
        ref={conRef}
        $style={props.style}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
      >
      </Container>
    </ReactResizeDetector>
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
          {children.Columns.propertyView({
            title: trans("gantt.ColumnsData"),
          })}
          {children.level.propertyView({
            label: trans("gantt.level"),
          })}
          {children.showToday.propertyView({
            label: trans("gantt.showTodayMark"),
          })}
        </Section>
        <Section name={sectionNames.interaction}>
          {children.allowTaskDrag.propertyView({
            label: trans("gantt.allowTaskDrag"),
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
          {children.allowProgressDrag.getView() && children.onProgressDragEvent.propertyView({
            title: trans("gantt.handleProgressDrag"),
          })}
        </Section>
        <Section name={sectionNames.layout}>
          {children.openAllBranchInit.propertyView({
            label: trans("gantt.openAllBranchInit"),
          }
          )}
          {children.onEvent.propertyView({
            title: trans("gantt.otherEvents"),
          }
          )}
          {hiddenPropertyView(children)}
        </Section>
        {/* <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section> */}
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
