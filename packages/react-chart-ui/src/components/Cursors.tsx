import React, { useEffect, useState } from 'react';
import { IconButton, RadioButton } from "ui";

import { Cross, Default, Eraser } from "../img/icons/cursors/index.js";

interface CursorsProps {
    chart: any;
    style?: React.CSSProperties;
  }
  
  export const Cursors = (props: CursorsProps) => {
    const [selectedCursor, setSelectedCursor] = useState('DEFAULT');

    useEffect(() => {
        const subscription = props?.chart?.subscribe('CURSOR_CHANGE', (data: any) => {
            if (data.cursor === "STAGE")
                setSelectedCursor("DEFAULT");
            else
                setSelectedCursor(data.cursor);
        })

        return () => {
            subscription?.unsubscribe();
        }
    })
    
    const cursors = [
        <IconButton
            id={'DEFAULT'}
            key={'DEFAULT'}
            active={selectedCursor === 'DEFAULT'}
        >
            <Default />
        </IconButton>,
        <IconButton
            id={'CROSSHAIR'}
            key={'CROSSHAIR'}
            active={selectedCursor === 'CROSSHAIR'}
        >
            <Cross />
        </IconButton>,
        <IconButton
            id={'ERASER'}
            key={'ERASER'}
            active={selectedCursor === 'ERASER'}
        >
            <Eraser />
        </IconButton>
    ]
    
    return <RadioButton
        buttons={cursors}
        currentButton={selectedCursor}
        defaultButton={'DEFAULT'}
        onSelect={onCursorClick}
    />;

    function onCursorClick(id: string) {
        setSelectedCursor(id);
        props.chart.setCursor(id);
    }
  };
  