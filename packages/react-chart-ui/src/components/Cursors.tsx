import React, { useEffect, useState } from 'react';
import { IconButton, RadioButton } from "ui";

import defaultCursorImage from "../img/icons/cursors/default.svg";
import crosshairCursorImage from "../img/icons/parallel.svg";
import eraserCursorImage from "../img/icons/cursors/eraser.svg";

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
            key={'DEFAULT'}
            image={defaultCursorImage.src}
            callback={() => { onCurosorClick('DEFAULT') }}
            active={selectedCursor === 'DEFAULT'}
        />,
        <IconButton
            key={'CROSSHAIR'}
            image={crosshairCursorImage.src}
            callback={() => { onCurosorClick('CROSSHAIR') }}
            active={selectedCursor === 'CROSSHAIR'}
        />,
        <IconButton
            key={'ERASER'}
            image={eraserCursorImage.src}
            callback={() => { onCurosorClick('ERASER') }}
            active={selectedCursor === 'ERASER'}
        />
    ]
    
    return <RadioButton buttons={cursors} currentButton={'test'} />;``

    function onCurosorClick(key: string) {
        setSelectedCursor(key);
        props.chart.setCursor(key);
    }
  };
  