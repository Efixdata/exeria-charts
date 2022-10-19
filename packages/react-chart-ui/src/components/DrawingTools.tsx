import React, { useState } from 'react';
import styled from "styled-components";
import { DrawingTool } from "./DrawingTool";


import fibonLinesImage from "../img/icons/fibon.svg";
import parallelChannelImage from "../img/icons/parallel.svg";
import triangleImage from "../img/icons/triangle.svg";
import arrowImage from "../img/icons/arrow.svg";
import trendlineImage from "../img/icons/trendline.svg";
import hLineImage from "../img/icons/horizontal_line.svg";
import vLineImage from "../img/icons/vertical_line.svg";
import mLineImage from "../img/icons/multi_line.svg";
import abcdImage from "../img/icons/abc.svg";
import ellipseImage from "../img/icons/ellipse.svg";
import vRangeImage from "../img/icons/vertical_range.svg";
import hRangeImage from "../img/icons/horizontal_range.svg";
import cycleImage from "../img/icons/cycles.svg";
import boxImage from "../img/icons/box.svg";
import textAnnotationImage from "../img/icons/text.svg";
import priceTagImage from "../img/icons/price_tag.svg";
import { Button, IconButton, SplitButton, TextButton } from 'ui';



interface DrawingToolsProps {
    chart: any;
    style?: React.CSSProperties;
  }
  
  const Container = styled.div`
    background-color: #100c22;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 26px;
  `
  
  export const DrawingTools = (props: DrawingToolsProps) => {

    const drawingTools = {
        fibonLines: {
            id: 'fibon',
            imageSource: fibonLinesImage.src,
            type: 'fibonLines',
            name: 'Fibonacci Levels',
            sticky: true,
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            values: [0, 23.6, 38.2, 50.0, 61.8, 78.6, 100, 161.8, 261.8, 423.6],
            valuesState: [true, true, true, true, true, true, true, false, false, false],
            valuesCanDelete: true,
            valuesCanAdd: true,
            fillBg: false,
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0, expandable: true, expanded: false, defaultDirection: 'left'},
                {stamp: 0, offset: 0, value: 0, _index: 0, expandable: true, expanded: false, defaultDirection: 'right'}
            ],
            order: 6
        },
        parallelChannel: {
            id: 'channel',
            imageSource: parallelChannelImage.src,
            type: 'parallelChannel',
            name: 'Parallel Channel',
            sticky: true,
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            fillBg: false,
            anchors: [
                {stamp: 0, offset: 0, 	value: 0, 	_index: 0, expandable: true, expanded: false, defaultDirection: 'left'},
                {stamp: 0, offset: 0, 	value: 0, 	_index: 0, expandable: true, expanded: false, defaultDirection: 'right'},
                {stamp: 0, offset: 0, 	value: 0, 	_index: 0}
            ],
            order: 2
        },
    
        triangle: {
            id: 'triangle',
            imageSource: triangleImage.src,
            type: 'triangle',
            name: 'Triangle',
            sticky: true,
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            fillBg: true,
            anchors: [
                {stamp: 0, offset: 0, 	value: 0, 	_index: 0},
                {stamp: 0, offset: 0, 	value: 0, 	_index: 0},
                {stamp: 0, offset: 0, 	value: 0, 	_index: 0}
            ],
            order: 11
        },
        arrow: {
            id: 'arrow',
            imageSource: arrowImage.src,
            type: 'arrow',
            name: 'Arrow',
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0}
            ],
            order: 8
        },
        trendLine: {
            id: 'trend',
            imageSource: trendlineImage.src,
            type: 'trendLine',
            name: 'Trend line',
            sticky: true,
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            canBeIndicator: true,
            isIndicator: false,
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0, expandable: true, expanded: false, defaultDirection: 'left'},
                {stamp: 0, offset: 0, value: 0, _index: 0, expandable: true, expanded: false, defaultDirection: 'right'}
            ],
            order: 1
        },
        hLine: {
            id: 'hLine',
            imageSource: hLineImage.src,
            type: 'hLine',
            name: 'Horizontal line',
            sticky: true,
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            canBeIndicator: true,
            isIndicator: false,
            setAnchorValue: [0], //st value to anchors with index
            priceMarker: true,
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0}
            ],
            order: 3
        },
        vLine: {
            id: 'vLine',
            imageSource: vLineImage.src,
            type: 'vLine',
            name: 'Vertical line',
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0}
            ],
            order: 4
        },
        mLine: {
            id: 'mLine',
            imageSource: mLineImage.src,
            type: 'mLine',
            name: 'Multi-line',
            sticky: true,
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0}
            ],
            order: 5
        },
        abcd: {
            id: 'abcd',
            imageSource: abcdImage.src,
            type: 'abcd',
            name: 'Abcd tool',
            sticky: true,
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            values: [38.2, 50, 61.8, 100, 161.8],
            valuesState: [true, true, true, true, true],
            valuesCanDelete: true,
            valuesCanAdd: true,
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0, expandable: true, expanded: false, defaultDirection: 'right'}
            ],
            order: 7
        },
        ellipse: {
            id: 'ellipse',
            imageSource: ellipseImage.src,
            type: 'ellipse',
            name: 'Ellipse',
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            fillBg: false,
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0}
            ],
            order: 9
        },
        vRange: {
            id: 'vRange',
            imageSource: vRangeImage.src,
            type: 'vRange',
            name: 'Vertical Range',
            defaultColor: "defaultToolColor",
            width: 1,
            text: '',
            flipped: false,
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0}
            ],
            order: 13
        },
        hRange: {
            id: 'hRange',
            imageSource: hRangeImage.src,
            type: 'hRange',
            name: 'Horizontal Range',
            defaultColor: "defaultToolColor",
            width: 1,
            text: '',
            flipped: false,
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0}
            ],
            order: 12
        },
        cycle: {
            id: 'cycle',
            imageSource: cycleImage.src,
            type: 'cycle',
            name: 'Cycle',
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            style: 'line',
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0}
            ],
            order: 14
        },
        box: {
            id: 'box',
            imageSource: boxImage.src,
            type: 'box',
            name: 'Rectangle',
            sticky: true,
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            style: 'line',
            fillBg: true,
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0}
            ],
            order: 10
        },
        textAnnotation: {
            id: 'textAnnotation',
            imageSource: textAnnotationImage.src,
            type: 'textAnnotation',
            name: 'Text',
            defaultColor: "defaultToolColor",
            fillBg: false,
            width: 1,
            dash: [],
            text: 'sample text',
            fontSize: 13,
            anchors: [
                {stamp: 0, offset: 0, value: 0, _index: 0},
                {stamp: 0, offset: 0, value: 0, _index: 0}
            ],
            order: 15
        },
        priceTag: {
            id: 'priceTag',
            imageSource: priceTagImage.src,
            type: 'priceTag',
            name: 'priceTag',
            sticky: true,
            defaultColor: "defaultToolColor",
            width: 1,
            dash: [],
            flipped: false,
            setAnchorValue: [0], //st value to anchors with index
            anchors: [
                { stamp: 0, offset: 0, value: 0, _index: 0 }
            ],
            order: 16
        },
    }
    
    const [selectedTool, setSelectedTool] = useState('');

    const renderDrawingTools = () => {
        const tools = [];        

        for (let key in drawingTools) {
            const tool = drawingTools[key];
            tools.push(
                <DrawingTool
                    key={tool.id}
                    imageSource={tool.imageSource}
                    chart={props.chart}
                    tool={tool}
                    active={tool.id === selectedTool}
                    onToolSelected={() => {
                        setSelectedTool(tool.id)
                    }}
                    onDrawingFinished={() => {
                        setSelectedTool("")
                    }}
                />
            );
        }
        
        return tools;
    }

    let selectedTool2;
    
    return (
      <Container style={props.style}>
        <SplitButton
            activeOption={selectedTool2}
            defaultOption='a'
            options = {[
                { id: 'a', text: <TextButton>test 1</TextButton>, icon: <IconButton image={arrowImage.src} />, callback: () => { setSelectedTool2('a') } },
                { id: 'b', text: <TextButton>test 1</TextButton>, icon: <IconButton image={textAnnotationImage.src} />, callback: () => { setSelectedTool2('b') } },
                { id: 'c', text: <TextButton>test 1</TextButton>, icon: <IconButton image={priceTagImage.src} />, callback: () => { setSelectedTool2('c') } },
                { id: 'd', text: <TextButton>very very long text</TextButton>, icon: <IconButton image={arrowImage.src} />, callback: () => { setSelectedTool2('d') } }
            ]}
        />
        {renderDrawingTools()}
      </Container>
    );

    function setSelectedTool2(id: string) : void {
        console.log('selected ', id);
        selectedTool2 = id;
    }
  };
  