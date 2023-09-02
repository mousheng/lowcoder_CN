import { trans } from "i18n";


export const akeyTooltip = (
    <li>
        {trans("amap.akeyNote")}
        <br />
        <a href="https://lbs.amap.com/api/javascript-api/guide/abc/prepare" target="_blank">{trans("amap.akeyTooltip")}</a>
    </li>
);

export const markersTooltip = (
    <li>
    {trans("amap.Introduction")}:
    <br />
    1. *position - {trans("amap.positionDes")}
    <br />
    2. title - {trans("amap.titleDes")}
  </li>
);
