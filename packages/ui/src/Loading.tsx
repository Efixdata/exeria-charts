import React from 'react';

import styled, { keyframes } from "styled-components";

const Spinner = styled.div`
  border: 1px solid #7f9dcc;
  border-top: 1px #fff solid; 
  border-radius: 50%;
  height: 14px;
  width: 14px;
  animation: spin 2s linear infinite;


  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`;


export const Loading = () =>{
    return <Spinner/>
}