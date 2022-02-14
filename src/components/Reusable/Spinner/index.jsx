import React from "react";
import styled from "styled-components";

export default function Spinner({ size, color }) {
  return (
    <Root size={size}>
      <Container size={size} color={color} />
    </Root>
  );
}

const Root = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: ${(props) => `${props.size}px` ?? "max-content"};
`;

const Container = styled.div`
  display: inline-block;
  width: ${(props) => `${props.size}px` ?? "50px"};
  height: ${(props) => `${props.size}px` ?? "50px"};
  border: 3px solid rgba(195, 195, 195, 0.6);
  border-radius: 50%;
  border-top-color: ${(props) => props.color ?? "#636767"};
  animation: spin 1s ease-in-out infinite;
  -webkit-animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to {
      -webkit-transform: rotate(360deg);
    }
  }

  @-webkit-keyframes spin {
    to {
      -webkit-transform: rotate(360deg);
    }
  }
`;
