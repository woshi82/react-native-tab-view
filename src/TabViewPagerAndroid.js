/* @flow */

import React, { PureComponent, Children, PropTypes } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  ViewPagerAndroid,
} from 'react-native';
import { PagerPropsPropType } from './TabViewPropTypes';
import type { PagerProps, PagerNormalizerProps } from './TabViewTypeDefinitions';

const AnimatedViewPager = Animated.createAnimatedComponent(ViewPagerAndroid);

type PageScrollEvent = {
  nativeEvent: {
    position: number;
    offset: number;
  };
}

type PageScrollState = 'dragging' | 'settling' | 'idle'

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  page: {
    overflow: 'hidden',
  },
});

type Props = PagerProps & {
  swipeEnabled?: boolean;
  animationEnabled?: boolean;
  children?: any;
}

export default class TabViewPagerAndroid extends PureComponent<void, Props, void> {
  static propTypes = {
    ...PagerPropsPropType,
    swipeEnabled: PropTypes.bool,
    animationEnabled: PropTypes.bool,
    children: PropTypes.node,
  };

  static normalize = ({ progress, offset }: PagerNormalizerProps) => Animated.add(progress, offset);

  componentWillMount() {
    this._currentIndex = this.props.navigationState.index;
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.layout !== nextProps.layout || Children.count(this.props.children) !== Children.count(nextProps.children)) {
      global.requestAnimationFrame(() => {
        this._setPage(nextProps.navigationState.index);
      });
    }
  }

  componentDidUpdate() {
    if (this._isIdle) {
      this._setPage(this.props.navigationState.index);
    }
  }

  _jumpListener: Object;
  _viewPager: Object;
  _isIdle: boolean = true;
  _currentIndex: number;

  _setPage = (index: number) => {
    if (this._viewPager && this._currentIndex !== index) {
      this._currentIndex = index;
      if (this.props.animationEnabled !== false) {
        this._viewPager.setPage(index);
      } else {
        this._viewPager.setPageWithoutAnimation(index);
      }
    }
  }

  _handlePageScrollStateChanged = (e: PageScrollState) => {
    if (e === 'idle') {
      this._isIdle = true;
      if (this._currentIndex !== this.props.navigationState.index) {
        this.props.jumpToIndex(this._currentIndex);
      }
    } else {
      this._isIdle = false;
    }
  };

  _handlePageSelected = (e: PageScrollEvent) => {
    this._currentIndex = e.nativeEvent.position;
  };

  _setRef = (el: Object) => (this._viewPager = el);

  render() {
    const { children, navigationState, swipeEnabled } = this.props;
    return (
      <AnimatedViewPager
        key={navigationState.routes.length}
        keyboardDismissMode='on-drag'
        initialPage={navigationState.index}
        scrollEnabled={swipeEnabled !== false}
        onPageScroll={Animated.event([ {
          nativeEvent: {
            position: this.props.progress,
            offset: this.props.offset,
          },
        } ])}
        onPageScrollStateChanged={this._handlePageScrollStateChanged}
        onPageSelected={this._handlePageSelected}
        style={styles.container}
        ref={this._setRef}
      >
        {Children.map(children, (child, i) => (
          <View
            key={navigationState.routes[i].key}
            testID={navigationState.routes[i].testID}
            style={styles.page}
          >
            {child}
          </View>
        ))}
      </AnimatedViewPager>
    );
  }
}
