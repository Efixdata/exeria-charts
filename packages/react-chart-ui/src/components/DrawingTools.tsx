import React, { ReactElement, useState } from 'react';
import styled from "styled-components";
// @ts-ignore
import { Fibonacci, Channel, Triangle, Arrow, LineTrend, LineHorizontal, LineVertical, LineMulti, Abcd, Oval, RangeVertical, RangeHorizontal, Cycles, Rectangle, Text, PriceTag } from "../img/icons/tools/index.js";
import { IconButton, SplitButton, TextButton } from 'ui';
import { DrawingTool } from './DrawingTool.js';

interface DrawingToolsProps {
    chart: any;
    style?: React.CSSProperties;
}

interface DrawingToolAnchor {
    stamp: number
    offset: number
    value: number
    _index: number
    expandable?: boolean
    expanded?: boolean
    defaultDirection?: 'left' | 'right'
}

interface DrawingToolProps {
    id: string
    type: string
    name: string
    defaultColor: string
    order: number
    sticky?: boolean
    width?: number
    dash?: number[]
    values?: number[]
    valuesState?: boolean[]
    valuesCanDelete?: boolean
    valuesCanAdd?: boolean
    fillBg?: boolean
    anchors: DrawingToolAnchor[]
    canBeIndicator?: boolean
    text?: string
    isIndicator?: boolean
    setAnchorValue?: number[]
    flipped?: boolean
    style?: string
    priceMarker?: boolean
    fontSize?: number
}

interface DrawingTool {
    icon: ReactElement
    props: DrawingToolProps
}
  
const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-gap: 4px;
`
  
export const DrawingTools = (props: DrawingToolsProps) => {

    const drawingTools : { [index: string]: DrawingTool } = {
        fibon: {
            icon: <Fibonacci/>,
            props: {
                id: 'fibon',
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
            }
        },
        channel: {
            icon: <Channel />,
            props: {
                id: 'channel',
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
            } 
        },
        triangle: {
            icon: <Triangle />,
            props: {
                id: 'triangle',
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
            }
        },
        arrow: {
            icon: <Arrow />,
            props: {
                id: 'arrow',
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
            }
        },
        trend: {
            icon: <LineTrend />,
            props: {
                id: 'trend',
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
            }
        },
        hLine: {
            icon: <LineHorizontal />,
            props: {
                id: 'hLine',
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
            }
        },
        vLine: {
            icon: <LineVertical />,
            props: {
                id: 'vLine',
                type: 'vLine',
                name: 'Vertical line',
                defaultColor: "defaultToolColor",
                width: 1,
                dash: [],
                anchors: [
                    {stamp: 0, offset: 0, value: 0, _index: 0}
                ],
                order: 4
            }
        },
        mLine: {
            icon: <LineMulti />,
            props: {
                id: 'mLine',
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
            }
        },
        abcd: {
            icon: <Abcd />,
            props: {
                id: 'abcd',
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
            }
        },
        ellipse: {
            icon: <Oval />,
            props: {
                id: 'ellipse',
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
            }
        },
        vRange: {
            icon: <RangeVertical />,
            props: {
                id: 'vRange',
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
            }
        },
        hRange: {
            icon: <RangeHorizontal />,
            props: {
                id: 'hRange',
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
            }
        },
        cycle: {
            icon: <Cycles />,
            props: { 
                id: 'cycle',
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
            }
        },
        box: {
            icon: <Rectangle />,
            props: {
                id: 'box',
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
            }
        },
        textAnnotation: {
            icon: <Text />,
            props: {
                id: 'textAnnotation',
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
            }
        },
        priceTag: {
            icon: <PriceTag />,
            props: {
                id: 'priceTag',
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
            }
        },
    }
    
    const [selectedTool, setSelectedTool] = useState('');

    const lines = renderSplitButton(['channel', 'hLine', 'vLine', 'mLine', 'trend'], 'trend');
    const shapes = renderSplitButton(['arrow', 'ellipse', 'triangle', 'box'], 'box');
    const analyticalTools = renderSplitButton(['abcd', 'cycle', 'fibon'], 'fibon');
    const textAnnotation = renderDrawingTool(drawingTools.textAnnotation);
    const priceTag = renderDrawingTool(drawingTools.priceTag);
    const ranges = renderSplitButton(['hRange', 'vRange'], 'vRange');
    
    return (
        
      <Container style={props.style}>
        { lines }
        { shapes }
        { analyticalTools }
        { textAnnotation }
        { priceTag }
        { ranges }
      </Container>
    );

    function renderDrawingTool(tool: any) {
        return (
            <IconButton 
                onClick={() => {onSelectTool(tool.props)}}
                active={tool.props.id === selectedTool}
            >
                { tool.icon }
            </IconButton>
        )
    }

    function renderSplitButton(ids:string[], defaultOption:string) {
        const options = ids.map(id => {
            // @ts-ignore
            return drawingTools[id]
        });

        return (
            <SplitButton
                defaultOption={defaultOption}
                // @ts-ignore
                activeOption={ids.indexOf(selectedTool) > -1 ? selectedTool : undefined}
                options={[{}, ...options].reduce(renderSplitButtonOption)}
            />
        );
    }

    function renderSplitButtonOption(options: any, option: any) {
        options[option.props.id] = {
            text: <TextButton>{option.props.name}</TextButton>,
            icon: <IconButton>{option.icon}</IconButton>,
            callback: () => { onSelectTool(option.props) }
        };

        return options;
    }

    function onSelectTool(tool: any) {
        const interactor = props.chart.getInteractor();
        if (interactor.currentMode && interactor.currentMode.onCancel) interactor.currentMode.onCancel();

        if (selectedTool === tool.id) {
            setSelectedTool('');
        } else {
            interactor.setMode('STAGE', { ...tool }, () => { setSelectedTool(""); });
            setSelectedTool(tool.id)
        }
    }
  };
  