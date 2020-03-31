import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import ShowHide from './components/ShowHide'
import BottomSheet from './components/BottomSheet'

export default function App() {
  return (
    <View style={styles.container}>
      <BottomSheet />
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
