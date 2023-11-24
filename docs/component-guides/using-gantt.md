
甘特图是一个复杂的高阶组件，组件通过列表和时间刻度表示出特定项目的顺序与持续时间，横轴表示时间，纵轴表示项目。

低代码平台Retool、Appsmith、Tooljet等都没有同类型组件，此次添加甘特图组件，作为拓展低代码使用边界的一次尝试。

本次甘特图选取了 [gantt-task-react](https://github.com/MaTeMaTuK/gantt-task-react) 作为组件。

![Alt text](../assets/3-1.gif)

## 列数据

编辑列数据，可以修改列表显示的内容、标题、单元格宽度、是否自动换行等等，还能单独控制某一列是否隐藏，当然您也可以通过 `隐藏列表` 选项来隐藏所有列。

![Alt text](../assets/image-32.png)

### 日期型数据列

当你选择列的数据类型为 `日期` 时，你可以自定义显示的日期格式，具体格式请参考 [dayjs format](https://day.js.org/docs/zh-CN/durations/format#docsNav)

![Alt text](../assets/image-33.png)

## 任务数据列表

任务数据是甘特图的核心属性，它记录着甘特图中所有项目的属性和项目间的关系，它是一个对象数组，每个对象的属性和作用见下表

### 任务数据对象

| 属性名 | 类型     | 描述    |
| :------------- | :------- | :---------------------------------------------------------------------------------------------------- |
| id\*           | string   | 任务ID，**请确保每个项目有一个唯一的ID**  |
| name\*         | string   | 任务名           |
| type\*         | string   | 任务显示类型: **task**, **milestone**, **project**    |
| start\*        | Date     | 任务开始日期                  |
| end\*          | Date     | 任务结束日期                  |
| progress\*     | number   | 任务进度. 取值从 0 到 100      |
| dependencies   | string[] | 指定父节点，会显示一个从父节点到自身的箭头 |
| styles         | object   | 指定当前任务的样式，具有如下属性:       |
|                |          | - **backgroundColor**: String. 指定任务背景颜色.                  |
|                |          | - **backgroundSelectedColor**: String. 指定任务选择后的背景颜色.  |
|                |          | - **progressColor**: String. 指定任务进度条的颜色.                |
|                |          | - **progressSelectedColor**: String. 指定任务进度条选择后的颜色.   |
| isDisabled     | bool     | 禁用当前任务的所有操作                |
| fontSize       | string   | 设置当前任务的字体大小。             |
| project        | string   | 任务项目名称             |
| hideChildren   | bool     | 隐藏子项目。该参数仅适用于 **type** 为 `project`    |

!> 带 **\*** 的为必要的参数

## 显示模式

甘特图支持多种显示模式，已满足你的项目需求，从 **小时视图** 一直到 **年视图**，默认为 **日视图**

![Alt text](../assets/image-34.png)

## 自定义提示框内容

当鼠标悬浮于项目上或左键拖动项目（需打开允许拖动修改日期）时，将显示提示框，您可以自定义提示框开始时间和结束时间的日期格式[dayjs format](https://day.js.org/docs/zh-CN/durations/format#docsNav)，以及持续的**时间单位**。
![Alt text](../assets/image-35.png)

## 组件事件

### 组件编辑事件

甘特图支持多种编辑事件，允许你直接拖动项目来**修改日期**、直接拖动进度条来**修改进度**和按Delete键来**删除项目**

![Alt text](../assets/image-36.png)

### 常规事件

常规事件支持 **单击**、**双击**和**展开子项目** 的事件回调

### 样式选项

甘特图的可调节样式非常多，因此将样式保存在对象中进行设置

| 参数名称                   | 类型   | 描述            |
| :------------------------- | :----- | :--------------------------------------------------------------------------------------------- |
| headerHeight               | number | 指定标题栏的高度。  |
| hourColumnWidth                | string | 小时视图时列宽度。    |
| quarterDayColumnWidth          | string | 1/4天视图时列宽度。    |
| halfDayColumnWidth          | string | 1/2天视图时列宽度。    |
| DayColumnWidth          | string | 日视图时列宽度。   |
| weekColumnWidth          | string | 周视图时列宽度。   |
| monthColumnWidth          | string | 月视图时列宽度。    |
| yearColumnWidth          | string | 年视图时列宽度。    |
| rowHeight                  | number | 指定行高度。|
| barCornerRadius            | number | 指定任务条的圆角半径。            |
| barFill                    | number | 指定任务条占用百分比，范围从 0 到 100。 |
| handleWidth                | number | 指定任务条拖动事件控制的宽度，用于开始和结束日期。            |
| fontFamily                 | string | 指定组件的字体。                  |
| fontSize                   | string | 指定组件的字体大小。              |
| barProgressColor           | string | 指定任务条进度填充颜色。        |
| barProgressSelectedColor   | string | 指定任务条选中时的进度填充颜色。|
| barBackgroundColor         | string | 指定任务条背景填充颜色。        |
| barBackgroundSelectedColor | string | 指定任务条选中时的背景填充颜色。|
| arrowColor                 | string | 指定关系箭头的填充颜色。            |
| arrowIndent                | number | 指定关系箭头的右侧缩进，以像素为单位。  |
| todayColor                 | string | 指定当前日期列的填充颜色。        |    |