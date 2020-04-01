import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import ShowHide from './components/ShowHide'
import BottomSheet from './components/BottomSheet'

// Manually
import AnimateHeight from './components/AnimateHeight'

// UI Thread
import WithTimingTransition from './components/WithTimingTransition'

// JS Thread
import UseTimingTransition from './components/UseTimingTransition'

export default function App() {
  return (
    <View style={styles.container}>
      <UseTimingTransition />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
