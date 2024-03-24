import dayjs from "dayjs";
import {DateParser, PickerMode, TimeParser} from "util/dateTimeUtils";
import { range } from "lodash";
import { DateTimeStyleType } from "../../controls/styleControlConstants";
import { css } from "styled-components";
import { isDarkColor, lightenColor } from "components/colorSelect/colorUtils";
import { CommonPickerMethods } from "antd/lib/date-picker/generatePicker/interface";
import { blurMethod, focusMethod } from "comps/utils/methodUtils";
import { refMethods } from "comps/generators/withMethodExposing";

export const handleDateChange = (
  time: string,
  onChange: (value: string) => Promise<unknown>,
  onEvent: (event: string) => void
) => {
  onChange(time).then(() => onEvent("change"));
};

export const disabledDate = (current: dayjs.Dayjs, min: string, max: string) => {
  const tmpMinDate = min === '' ? undefined : min
  const tmpMaxDate = max === '' ? undefined : max
  const maxDate = dayjs(tmpMaxDate, DateParser);
  const minDate = dayjs(tmpMinDate, DateParser);

  return (
    current &&
    current.isValid() &&
    (current.isAfter(maxDate, "date") || current.isBefore(minDate, "date"))
  );
};

export const disabledTime = (min: string, max: string, hourStep = 1, minuteStep = 1, secondStep = 1) => {
  const tmpMinTime = min === '' ? undefined : min
  const tmpMaxTime = max === '' ? undefined : max
  const maxTime = dayjs(tmpMaxTime, TimeParser);
  const minTime = dayjs(tmpMinTime, TimeParser);

  return {
    disabledHours: () => {
      let disabledHours: number[] = [];
      for (let i = 0; i < 24; i++) {
        if (i % hourStep !== 0 || (minTime.isValid() && i < minTime.hour()) || (maxTime.isValid() && i > maxTime.hour())) {
          disabledHours.push(i);
        }
      }
      return disabledHours;
    },
    disabledMinutes: (hour: number) => {
      let disabledMinutes: number[] = [];
      for (let i = 0; i < 60; i++) {
        if (i % minuteStep !== 0 || (minTime.isValid() && hour === minTime.hour() && i < minTime.minute()) || (maxTime.isValid() && hour === maxTime.hour() && i > maxTime.minute())) {
          disabledMinutes.push(i);
        }
      }
      return disabledMinutes;
    },
    disabledSeconds: (hour: number, minute: number) => {
      let disabledSeconds: number[] = [];
      for (let i = 0; i < 60; i++) {
        if (i % secondStep !== 0 || (minTime.isValid() && hour === minTime.hour() && minute === minTime.minute() && i < minTime.second()) || (maxTime.isValid() && hour === maxTime.hour() && minute === maxTime.minute() && i > maxTime.second())) {
          disabledSeconds.push(i);
        }
      }
      return disabledSeconds;
    },
  };
};

export const getStyle = (style: DateTimeStyleType) => {
  return css`
    height: 32px;
    border-radius: ${style.radius};
    &:not(.ant-picker-disabled) {
      border-color: ${style.border};
      background-color: ${style.background};

      input {
        color: ${style.text};

        &::-webkit-input-placeholder {
          color: ${style.text};
          opacity: 0.25;
        }
      }

      &.ant-picker-focused,
      &:hover {
        border-color: ${style.accent};
      }

      .ant-picker-suffix,
      .ant-picker-clear,
      .ant-picker-separator {
        background-color: ${style.background};
        color: ${style.text === "#222222"
          ? "#8B8FA3"
          : isDarkColor(style.text)
          ? lightenColor(style.text, 0.2)
          : style.text};
      }

      .ant-picker-clear {
        inset-inline-end: 1px;
        font-size: 16px;
        inset-inline-end: 18px
      }

      .ant-picker-clear:hover {
        color: ${style.text === "#222222"
          ? "#8B8FA3"
          : isDarkColor(style.text)
          ? lightenColor(style.text, 0.1)
          : style.text};
      }

      .ant-picker-active-bar {
        background-color: ${style.accent};
      }
    }
  `;
};

export const getMobileStyle = (style: DateTimeStyleType) =>
  css`
    color: ${style.text};
    background-color: ${style.background};
    border-radius: ${style.radius};
    border-color: ${style.border};
  `;

export const dateRefMethods = refMethods<CommonPickerMethods>([focusMethod, blurMethod]);

/**
 * 处理移动端年月周选择器，季度选择器antd mobile暂时不支持，使用原有方案
 * @param precisionType
 * @param showTime
 */
export const getPrecisionType =( showTime:boolean,precisionType?:PickerMode)=>{
  // precisionType不存在时，为日期区间选择器，为date时，为日期选择器，这个时候不用处理
  if (precisionType==='week' || precisionType==='month' || precisionType==='year'){
    return precisionType
  }else{
    return showTime ? "second" : "day"
  }
}
