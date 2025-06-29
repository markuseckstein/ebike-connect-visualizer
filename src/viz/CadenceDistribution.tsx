import React from "react";
import { useColorModeValue, useTheme } from "@chakra-ui/react";
import { Distribution } from "./Distribution";

export const CadenceDistribution: React.FC = () => {
  const theme = useTheme();
  const strokeColor = useColorModeValue(
    theme.colors.yellow[500],
    theme.colors.yellow[300],
  );
  const fillColor = useColorModeValue(
    theme.colors.yellow[200],
    theme.colors.yellow[100],
  );

  return (
    <Distribution
      dataKey="cadence"
      heading="Cadence"
      unit="RPM"
      strokeColor={strokeColor}
      fillColor={fillColor}
    />
  );
};
