/* eslint-disable @next/next/no-img-element */
import React from "react";
import {useEffect, useState} from "react";

interface CurrencySwitchProps {
  chart: any;
}

export const CurrencySwitch = (props: CurrencySwitchProps) => {
    const defaultValueAxisWidth = props.chart ? props.chart.getValueAxisWidth() : 40;
    const [valueAxisWidth, setValueAxisWidth] = useState(defaultValueAxisWidth);

    useEffect(() => {
        const subscription = props?.chart?.subscribe('VALUE_AXIS_WIDTH_CHANGE', (data: number) => {
            setValueAxisWidth(data);
        })

        return () => {
            subscription?.unsubscribe();
        }
    });

    return ( 
        <div style={{ width: valueAxisWidth, borderLeft: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center"}}>
            <div style={{ color: "#7f9dcc", marginLeft: "auto", marginRight: "8px" }}>{props?.chart?.getCurrency()}</div>
        </div>
    );
};
