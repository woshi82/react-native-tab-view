/* @flow */

import React, { PureComponent, PropTypes } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { NavigationStatePropType } from './TabViewPropTypes';
import type {
  Layout,
  Scene,
  Route,
  NavigationState,
  SceneRendererProps,
  PagerProps,
} from './TabViewTypeDefinitions';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});

type DefaultProps = {
  renderPager: (props: PagerProps) => React.Element<*>;
}

type Props = {
  navigationState: NavigationState;
  onRequestChangeTab: (index: number) => void;
  onChangePosition?: (value: number) => void;
  initialLayout?: Layout;
  canJumpToTab?: (route: Route) => boolean;
  lazy?: boolean;
  renderPager: (props: PagerProps) => React.Element<*>;
  renderScene: (props: SceneRendererProps & Scene) => ?React.Element<*>;
  renderHeader?: (props: SceneRendererProps) => ?React.Element<*>;
  renderFooter?: (props: SceneRendererProps) => ?React.Element<*>;
}

type State = {
  layout: Layout & {
    measured: boolean;
  };
  progress: Animated.Value;
  offset: Animated.Value;
  position: Animated.Value;
  loaded: Array<number>;
  height: Animated.Value;
  width: Animated.Value;
}

let TabViewPager;

switch (Platform.OS) {
case 'android':
  TabViewPager = require('./TabViewPagerAndroid').default;
  break;
case 'ios':
  TabViewPager = require('./TabViewPagerScroll').default;
  break;
default:
  TabViewPager = require('./TabViewPagerPan').default;
  break;
}

export default class TabViewAnimated extends PureComponent<DefaultProps, Props, State> {
  static propTypes = {
    navigationState: NavigationStatePropType.isRequired,
    initialLayout: PropTypes.shape({
      height: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired,
    }).isRequired,
    onChangePosition: PropTypes.func,
    canJumpToTab: PropTypes.func,
    lazy: PropTypes.bool,
    renderPager: PropTypes.func.isRequired,
    renderScene: PropTypes.func.isRequired,
    renderHeader: PropTypes.func,
    renderFooter: PropTypes.func,
  };

  static defaultProps = {
    initialLayout: {
      height: 0,
      width: 0,
    },
    renderPager: (props: PagerProps) => <TabViewPager {...props} />,
  };

  constructor(props: Props) {
    super(props);

    const layout = {
      ...this.props.initialLayout,
      measured: false,
    };

    const progress = new Animated.Value(0);
    const offset = new Animated.Value(this.props.navigationState.index);
    const height = new Animated.Value(layout.height || 0.0001);
    const width = new Animated.Value(layout.width || 0.0001);

    const pager = this.props.renderPager({
      layout,
      progress,
      offset,
      navigationState: this.props.navigationState,
      jumpToIndex: () => {},
    });

    const position = pager.type.normalize({
      progress,
      offset,
      layout: { width, height },
    });

    this.state = {
      layout,
      progress,
      offset,
      position,
      loaded: [ this.props.navigationState.index ],
      height,
      width,
    };
  }

  state: State;

  componentDidMount() {
    this.state.progress.addListener(this._trackPosition);
    this.state.offset.addListener(this._trackPosition);
    this.state.animatedLayout.width.addListener(this._trackPosition);
  }

  componentWillUnmount() {
    this.state.progress.removeListener(this._trackPosition);
    this.state.offset.removeListener(this._trackPosition);
    this.state.animatedLayout.width.removeListener(this._trackPosition);
  }

  _trackPosition = () => {
    this._handleChangePosition(this.state.position.__getValue());
  }

  _renderScene = (props: SceneRendererProps & Scene) => {
    const { renderScene, navigationState, lazy } = this.props;
    const { loaded } = this.state;
    if (lazy) {
      if (loaded.includes(navigationState.routes.indexOf(props.route))) {
        return renderScene(props);
      }
      return null;
    }
    return renderScene(props);
  };

  _renderItems = () => {
    const { renderPager, renderHeader, renderFooter, navigationState } = this.props;
    const { layout } = this.state;
    const currentRoute = navigationState.routes[navigationState.index];
    const pagerProps = this._buildPagerProps();
    const sceneRendererProps = this._buildSceneRendererProps();

    return (
      <View style={styles.container}>
        {renderHeader && renderHeader(sceneRendererProps)}
        {renderPager({
          ...pagerProps,
          children: navigationState.routes.map((route, index) => (
            this._renderScene({
              ...sceneRendererProps,
              route,
              index,
              focused: index === navigationState.index,
            })
          )),
        })}
        {renderFooter && renderFooter(sceneRendererProps)}
      </View>
    );
  };

  _handleChangePosition = (value: number) => {
    const { onChangePosition, navigationState, lazy } = this.props;
    if (onChangePosition) {
      onChangePosition(value);
    }
    const { loaded } = this.state;
    if (lazy) {
      let next = Math.ceil(value);
      if (next === navigationState.index) {
        next = Math.floor(value);
      }
      if (loaded.includes(next)) {
        return;
      }
      this.setState({
        loaded: [ ...loaded, next ],
      });
    }
  };

  _handleLayout = (e: any) => {
    const { height, width } = e.nativeEvent.layout;

    this.state.height.setValue(height || 0.0001);
    this.state.width.setValue(width || 0.0001);

    if (this.state.layout.width === width && this.state.layout.height === height) {
      return;
    }

    this.setState({
      layout: {
        measured: true,
        height,
        width,
      },
    });
  };

  _buildPagerProps = (): PagerProps => {
    return {
      layout: this.state.layout,
      progress: this.state.progress,
      offset: this.state.offset,
      navigationState: this.props.navigationState,
      jumpToIndex: this._jumpToIndex,
    };
  };

  _buildSceneRendererProps = (): SceneRendererProps => {
    return {
      layout: this.state.layout,
      position: this.state.position,
      navigationState: this.props.navigationState,
      jumpToIndex: this._jumpToIndex,
    };
  };

  _jumpToIndex = (index: number) => {
    if (!this._mounted) {
      // We are no longer mounted, this is a no-op
      return;
    }

    const { canJumpToTab, navigationState } = this.props;

    if (canJumpToTab && !canJumpToTab(navigationState.routes[index])) {
      return;
    }

    this.props.onRequestChangeTab(index);
  };

  render() {
    return (
      <View
        {...this.props}
        loaded={this.state.loaded}
        onLayout={this._handleLayout}
      >
        {this._renderItems()}
      </View>
    );
  }
}
