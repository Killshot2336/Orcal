import React from 'react';
import { Text, type TextProps, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/tokens';

type Variant = 'brand' | 'title' | 'body' | 'caption' | 'plaque';

export function SanctuaryText({
  variant = 'body',
  style,
  ...rest
}: TextProps & { variant?: Variant }) {
  return <Text {...rest} style={[styles.base, styles[variant], style]} />;
}

const styles = StyleSheet.create({
  base: {
    color: colors.ink,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 52,
    letterSpacing: 3,
    color: colors.gold,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: 1,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 26,
    color: colors.ink,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    letterSpacing: 0.4,
  },
  plaque: {
    fontFamily: fonts.displayItalic,
    fontSize: 20,
    lineHeight: 30,
    color: colors.ink,
  },
});
