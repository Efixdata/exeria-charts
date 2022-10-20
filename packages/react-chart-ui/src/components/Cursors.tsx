import React, { useEffect, useState } from 'react';
import styled from "styled-components";
import { IconButton } from "ui";

import defaultCursorImage from "../img/icons/cursors/default.svg";
import crosshairCursorImage from "../img/icons/parallel.svg";
import eraserCursorImage from "../img/icons/cursors/eraser.svg";

interface CursorsProps {
    chart: any;
    style?: React.CSSProperties;
  }
  
  const Container = styled.div`
    background-color: rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin: 8px;
    border-radius: 4px;
  `

  interface CursorElement {
    name: CursorKey,
    image: any,
    onClick: () => void
  }

  enum CursorKey {
    DEFAULT,
    CROSSHAIR,
    ERASER,
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
    

    const renderCursors = () => {
        const cursors = {
            DEFAULT: {
                name: "Default",
                image: defaultCursorImage
            },
            CROSSHAIR: {
                name: "Croosshair",
                image: crosshairCursorImage
            },
            ERASER: {
                name: "Eraser",
                image: eraserCursorImage
            }
        }

        const cursorElements = [];

        for (let key in cursors) {
            // @ts-ignore
            const cursor: CursorElement = cursors[key];
            cursorElements.push(
                <IconButton
                    key={key}
                    image={cursor.image.src}
                    onClick={() => {
                        setSelectedCursor(key);
                        props.chart.setCursor(key);
                    }}
                    active={selectedCursor === key}
                />
            );
        }
        
        return cursorElements;
    }
    
    return (
    // @ts-ignore
      <Container style={props.style}>
        {renderCursors()}
      </Container>
    );
  };
  