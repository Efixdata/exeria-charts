/* eslint-disable @next/next/no-img-element */
import {useEffect, useState} from "react";
import styled from "styled-components";

const Currency = styled.div`
    color: ${props => props.theme.toolbar.buttons.color}
}`

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
            <Currency style={{marginLeft: "auto", marginRight: "8px" }}>{props?.chart?.getCurrency()}</Currency>
        </div>
    );
};
