/* @flow */

import type { PagerProps } from './TabViewTypeDefinitions';

function forHorizontal(props: PagerProps) {
  const { layout, offset, navigationState } = props;
  const { width } = layout;
  const { routes } = navigationState;
  // Prepend '-1', so there are always at least 2 items in inputRange
  const inputRange = [ -1, ...routes.map((x, i) => i) ];
  const outputRange = inputRange.map(i => {
    return width * i * -1;
  });

  const translateX = offset.interpolate({
    inputRange,
    outputRange,
  });

  return {
    transform: [ { translateX } ],
  };
}

export default {
  forHorizontal,
};
