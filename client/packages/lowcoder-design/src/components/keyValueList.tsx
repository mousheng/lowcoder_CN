import React, { useState, useEffect, useRef } from 'react';
import styled from "styled-components";
import { ReactComponent as Bin } from "icons/icon-recycle-bin.svg";
import { TacoButton } from "./button";
import { ReactNode } from "react";
import { BatchAddIcon, BluePlusIcon } from "icons";
import { trans } from "i18n/design";
import { Space, Tooltip, Modal, Button, Segmented, Input, InputRef } from 'antd';
const { TextArea } = Input;

const KeyValueListItem = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  margin-bottom: 8px;
`;

const DelIcon = styled(Bin) <{
  $forbidden?: boolean;
}>`
  height: 16px;
  width: 16px;
  margin-left: 8px;
  flex-shrink: 0;

  g g {
    ${(props) => props.$forbidden && "stroke: #D7D9E0;"}
  }

  :hover {
    cursor: ${(props) => (props.$forbidden ? "default" : "pointer")};
  }

  &:hover g {
    ${(props) => !props.$forbidden && "stroke: #315efb;"}
  }
`;

const AddIcon = styled(BluePlusIcon)`
  height: 8px;
  width: 8px;
  margin-right: 4px;
`;
const AddBtn = styled(TacoButton) < { $visable?: boolean }> `
  height: 13px;
  padding: 0;
  color: #4965f2;
  border: none;
  display: flex;
  opacity: ${(props) => props.$visable ? '0' : '100'} ;
  align-items: center;
  font-size: 13px;
  line-height: 13px;
  box-shadow: none;
  margin-bottom: 2px;

  :hover {
    color: #315efb;
    border: none;
    background-color: #ffffff;
  }

  :focus {
    color: #315efb;
    border: none;
    background-color: #ffffff;
  }

  &:hover ${AddIcon} g {
    stroke: #315efb;
  }

  > svg {
    height: 12px;
    width: 12px;
  }
`;

export const KeyValueList = (props: {
  list: ReactNode[];
  onAdd: () => void;
  onDelete: (item: ReactNode, index: number) => void;
  onBatchAdd?: (value: Record<string, any>) => void;  // added by mousheng
  data?: any,
}) => {
  const inputRef = useRef<InputRef>(null);
  const [buttonVisable, setButtonVisable] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showText, setShowText] = useState("");
  const [formatFlag, setFormatFlag] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const handleOk = () => {
    let lines = showText.trim().split(/[(\r\n)\r\n]+/)
    let result = lines.map(item => {
      const colonIndex = item.indexOf(':');
      if (colonIndex !== -1) {                                                                                                    
        const key = item.substring(0, colonIndex).trim();
        const value = item.substring(colonIndex + 1).trim();
        return { key, value };
      } else {
        return {};
      }
    })
    props.onBatchAdd ? props.onBatchAdd(result) : ''
    setIsModalOpen(false);
  }

  function objectToLines(obj: Record<string, any>): string {
    const lines = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const formattedValue = typeof value === 'string' ? value : JSON.stringify(value);
        const line = `${key}: ${formattedValue}`;
        lines.push(line);
      }
    }
    return lines.join('\n');
  }

  function edgeFormatToLines() {
    let result = ''
    let lines = showText.split(/[(\r\n)\r\n]+/)
    for (let i = 0; i < lines.length + 1; i += 2) {
      if (lines[i] && lines[i].trim())
        result += lines[i] + lines[i + 1] + '\n'
    }
    setShowText(result.trim())
  }

  const handelShowValues = () => {
    let tempValues = {}
    if (props.data)
      tempValues = Object.assign({}, ...props.data.map((item: any) => ({ [item.children.key.toJsonValue()]: item.children.value.toJsonValue() })))
    setShowText(objectToLines(tempValues))
  }

  useEffect(() => {
    handelShowValues()
  }, [])

  useEffect(() => {
    let lines = showText.trim().split(/[(\r\n)\r\n]+/)
    setFormatFlag(lines.length > 2 && lines[0].trim().endsWith(':'))
  }, [showText])

  return (
    <>
      {props.list.map((item, index) => (
        <KeyValueListItem key={index /* FIXME: find a proper key instead of `index` */}>
          {item}
          <DelIcon
            onClick={() => props.list.length > 1 && props.onDelete(item, index)}
            $forbidden={props.list.length === 1}
          />
        </KeyValueListItem>
      ))}
      <Space size='middle'
        onMouseEnter={() => setButtonVisable(true)}
        onMouseLeave={() => setButtonVisable(false)}>
        <AddBtn onClick={() => props.onAdd()}>
          <AddIcon />
          {trans("addItem")}
        </AddBtn>
        {
          navigator.clipboard && props.onBatchAdd
          &&
          <AddBtn
            $visable={buttonVisable ? false : true}
          >
            <BatchAddIcon />
            <Tooltip title={trans('batchAddDesc')}>
              <span onClick={() => { handelShowValues(); showModal(); }}>{trans('batchEdit')}</span>
            </Tooltip>
            <Modal title={trans('batchEdit')}
              open={isModalOpen}
              style={{ top: '20%' }}
              width={'40%'}
              onOk={handleOk}
              onCancel={handleCancel}
            >
              <Space direction="vertical" size="small" style={{ display: 'flex' }}>
                <TextArea
                  ref={inputRef}
                  onDoubleClick={() => inputRef.current!.focus({ cursor: 'all', })}
                  spellCheck={false}
                  rows={8}
                  defaultValue={showText}
                  value={showText}
                  onChange={(e) => setShowText(e.target.value)} />
                <Tooltip title={trans('formatDesc')}>
                  <Button
                    type="primary"
                    size='small'
                    disabled={!formatFlag}
                    onClick={edgeFormatToLines}>{trans('transform')}
                  </Button>
                </Tooltip>
              </Space>
            </Modal>
          </AddBtn>
        }
      </Space>
    </>
  )
};
