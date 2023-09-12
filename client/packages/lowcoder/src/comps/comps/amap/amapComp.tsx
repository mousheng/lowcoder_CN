import { useEffect, useRef, useState } from 'react';
import { RecordConstructorToView } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { arrayNumberExposingStateControl, arrayObjectExposingStateControl, jsonValueExposingStateControl, numberExposingStateControl } from "comps/controls/codeStateControl";
import { styleControl } from "comps/controls/styleControl";
import { amapStyle, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { StringControl } from "comps/controls/codeControl";

import { config as AmapReactConfig, ControlBar, Scale, Toolbar } from '@amap/amap-react';
import { Amap, Marker } from '@amap/amap-react';

import { akeyTooltip, markersTooltip } from './amapConstants';
import { JSONObject, addedMarkerEvent, amapMoveEndEvent, clickEvent, clickMarkerEvent, delteMarkerEvent, eventHandlerControl, jsonValueControl, withDefault } from '@lowcoder-ee/index.sdk';
import _ from "lodash"

const EventOptions = [
  { ...clickEvent, ...{ label: "点击地图时" } },
  addedMarkerEvent,
  delteMarkerEvent,
  clickMarkerEvent,
  amapMoveEndEvent,
] as const;

const childrenMap = {
  value: withDefault(StringControl, "a7a90e05a37d3f6bf76d4a9032fc9129"),
  allowAdd: BoolControl.DEFAULT_TRUE,
  center: arrayNumberExposingStateControl("center", [118.321993, 28.710649]),
  clickedPosition: arrayNumberExposingStateControl("clickedPosition", [0, 0]),
  zoom: numberExposingStateControl("zoom", 5),
  allowAddMark: BoolControl,
  allowDelMark: BoolControl,
  showControlBar: BoolControl,
  showZoomButton: BoolControl,
  defaultTitle: jsonValueControl({ title: "default" }),
  markers: arrayObjectExposingStateControl("markers", [{ "position": [119.306399, 26.127066], "title": "福州" }, { "position": [120.185305, 30.307673], "title": "杭州" }, { "position": [115.878665, 28.739952], "title": "南昌" }]
  ),
  style: styleControl(amapStyle),
  clickedMarker: jsonValueExposingStateControl("clickedMarker", {}),
  onEvent: eventHandlerControl(EventOptions),
};

const AmapView = (props: RecordConstructorToView<typeof childrenMap>) => {
  AmapReactConfig.version = '2.0';
  AmapReactConfig.key = props.value;
  AmapReactConfig.plugins = [
  ];
  const mapRef = useRef();
  const [marks, setMarks] = useState(props.markers.value ?? []);
  const [zoom, setZoom] = useState(props.zoom.value)

  useEffect(() => {
    setMarks(props.markers.value)
    props.markers.onChange(props.markers.value)
  }, [props.markers])

  useEffect(() => {
    setZoom(props.zoom.value)
  }, [props.zoom.value])

  const handleClickMap = (e: any, p: any) => {
    props.clickedPosition.onChange([p.lnglat.lng, p.lnglat.lat])
    if (props.allowAddMark) {
      let temp = [...marks as JSONObject[], { ...props.defaultTitle as object, position: [p.lnglat.lng, p.lnglat.lat], }]
      setMarks(temp)
      props.markers.onChange(temp)
      props.onEvent('addedMarker')
    } else {
      props.onEvent('click')
    }
  }

  const handleDelMark = (i: number) => {
    if (props.allowDelMark) {
      let temp = _.cloneDeep(marks as JSONObject[])
      _.pullAt(temp, [i])
      setMarks(temp)
      props.markers.onChange(temp)
      props.onEvent('delteMarker')
    }
  }

  return (
    <div
      style={{
        margin: props.style.margin,
        width: widthCalculator(props.style.margin),
        height: heightCalculator(props.style.margin),
      }}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      <Amap
        ref={mapRef}
        onClick={handleClickMap}
        center={props.center.value}
        zoom={zoom}
        onMoveEnd={(map) => {
          props.center.onChange(map.getCenter().toArray())
          props.onEvent("amapMoveEnd")
        }
        }
      >
        {props.showControlBar && <ControlBar position={{ top: '10px', left: '10px' }} />}
        <Scale ></Scale>
        {props.showZoomButton && <Toolbar position={{ top: '110px', left: '40px' }} />}
        {
          (marks as JSONObject[]).map((m, i) => (
            <Marker
              position={m.position as [number, number]}
              key={i}
              label={{
                content: m.title as string ?? "",
                direction: 'bottom',
              }}
              onRightClick={() => handleDelMark(i)}
              onClick={() => {
                props.clickedMarker.onChange({ ...m, index: i })
                props.onEvent("clickMarker")
              }}
            >
            </Marker>
          ))
        }
      </Amap>
    </div>
  );
};

let AmapBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => <AmapView {...props} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("amap.akey"),
            tooltip: akeyTooltip,
            placeholder: "a7a90e05a37d3f6bf76d4a9032fc9129",
          })}
          {children.zoom.propertyView({
            label: trans("amap.zoom"),
          })}
          {children.markers.propertyView({
            label: trans("amap.markers"),
            tooltip: markersTooltip,
          })}
          {children.center.propertyView({
            label: trans("amap.center"),
            tooltip: trans("amap.centerDes")
          })}
          {children.allowAddMark.propertyView({
            label: trans("amap.allowAddMark"),
            tooltip: trans("amap.allowAddMarkDes")
          })}
          {children.allowAddMark.getView() && children.defaultTitle.propertyView({
            label: trans("amap.defaultTitle"),
          })}
          {children.allowDelMark.propertyView({
            label: trans("amap.allowDelMark"),
            tooltip: trans("amap.allowDelMarkDes")
          })}
        </Section>
        <Section name={sectionNames.advanced}>
          {children.showControlBar.propertyView({
            label: trans("amap.showControlBar"),
          })}
          {children.showZoomButton.propertyView({
            label: trans("amap.showZoomButton"),
          })}
        </Section>
        <Section name={sectionNames.layout}>
          {children.onEvent.getPropertyView()}
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
      </>
    ))
    .build();
})();

AmapBasicComp = class extends AmapBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const AmapComp = withExposingConfigs(AmapBasicComp, [
  new NameConfig("markers", trans("amap.markersValueDes")),
  new NameConfig("center", trans("amap.centerValueDes")),
  new NameConfig("clickedPosition", trans("amap.clickedPositionDes")),
  new NameConfig("clickedMarker", trans("amap.clickedMarkerDes")),
  new NameConfig("zoom", trans("amap.zoomValueDes")),
  NameConfigHidden,
]);
