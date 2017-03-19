/* @flow */

import { Animated } from 'react-native';

export type Route = {
  key: string;
  title?: string;
  testID?: string;
  accessibilityLabel?: string;
  accessible?: boolean;
}

export type NavigationState = {
  index: number;
  routes: Array<Route>;
}

export type Scene = {
  route: Route;
  focused: boolean;
  index: number;
}

export type Layout = {
  height: number;
  width: number;
}

export type PagerProps = {
  layout: Layout & {
    measured: boolean;
  };
  navigationState: NavigationState;
  progress: Animated.Value;
  offset: Animated.Value;
  onChangeTab: (index: number) => void;
}

export type PagerNormalizerProps = {
  progress: Animated.Value;
  offset: Animated.Value;
  layout: {
    height: Animated.Value;
    width: Animated.Value;
  };
}

export type SceneRendererProps = {
  layout: Layout & {
    measured: boolean;
  };
  navigationState: NavigationState;
  position: Animated.Value;
  onChangeTab: (index: number) => void;
}
