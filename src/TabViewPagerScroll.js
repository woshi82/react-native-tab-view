/* @flow */

import React, { PureComponent, Children, PropTypes } from 'react';
import {
  Animated,
  StyleSheet,
  View,
} from 'react-native';
import { PagerPropsPropType } from './TabViewPropTypes';
import type { PagerProps, PagerNormalizerProps } from './TabViewTypeDefinitions';

type ScrollEvent = {
  nativeEvent: {
    contentOffset: {
      x: number;
      y: number;
    };
  };
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  page: {
    flex: 1,
    overflow: 'hidden',
  },
});

type Props = PagerProps & {
  swipeEnabled?: boolean;
  children?: any;
}

export default class TabViewPagerScroll extends PureComponent<void, Props, void> {
  static propTypes = {
    ...PagerPropsPropType,
    swipeEnabled: PropTypes.bool,
    children: PropTypes.node,
  };

  static normalize = ({ progress, layout }: PagerNormalizerProps) => {
    return Animated.divide(
      progress,
      width: layout.width,
    );
  };

  componentDidMount() {
    this._scrollTo(this.props.navigationState.index * this.props.layout.width);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.layout !== this.props.layout || Children.count(prevProps.children) !== Children.count(this.props.children)) {
      global.requestAnimationFrame(() =>
        this._scrollTo(this.props.navigationState.index * this.props.layout.width)
      );
    }
  }

  _scrollView: Object;

  _scrollTo = (x: number) => {
    if (this._scrollView) {
      this._scrollView.scrollTo({
        x,
        animated: false,
      });
    }
  };

  _handleMomentumScrollEnd = (e: ScrollEvent) => {
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / this.props.layout.width);
    this.props.onChangeTab(nextIndex);
  };

  _setRef = (el: Object) => (this._scrollView = el);

  render() {
    const { children, layout, navigationState } = this.props;
    return (
      <Animated.ScrollView
        horizontal
        pagingEnabled
        directionalLockEnabled
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='always'
        scrollEnabled={this.props.swipeEnabled}
        automaticallyAdjustContentInsets={false}
        bounces={false}
        alwaysBounceHorizontal={false}
        scrollsToTop={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([ {
          nativeEvent: {
            contentOffset: { x: this.props.offset },
          },
        } ])}
        onMomentumScrollEnd={this._handleMomentumScrollEnd}
        contentOffset={{ x: this.props.navigationState.index * this.props.layout.width, y: 0 }}
        style={styles.container}
        contentContainerStyle={layout.width ? null : styles.container}
        ref={this._setRef}
      >
        {Children.map(children, (child, i) => (
          <View
            key={navigationState.routes[i].key}
            testID={navigationState.routes[i].testID}
            style={
              layout.width ?
                { width: layout.width, overflow: 'hidden' } :
                i === navigationState.index ? styles.page : null
            }
          >
            {i === navigationState.index || layout.width ? child : null}
          </View>
        ))}
      </Animated.ScrollView>
    );
  }
}
