import React from 'react'
import Animated from 'react-native-reanimated'
import { timing } from 'react-native-redash'
import { Button, View } from 'react-native'

const { add, block, set, sub, useCode } = Animated

const boxHeight: Animated.Value<number> = new Animated.Value(100)
const newBoxHeight = new Animated.Value(100)

export default () => {
  useCode(
    () =>
      block([
        set(
          boxHeight,
          timing({ from: boxHeight, to: newBoxHeight, duration: 1000 }),
        ),
      ]),
    [],
  )
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[{ height: boxHeight, width: 100, backgroundColor: 'red' }]}
      ></Animated.View>
      <Button
        title="+ height"
        onPress={() => {
          console.log('SPRING')
          newBoxHeight.setValue(add(boxHeight, 200))
        }}
      ></Button>
      <Button
        title="- height"
        onPress={() => {
          console.log('SPRING')
          newBoxHeight.setValue(sub(boxHeight, 200))
        }}
      ></Button>
    </View>
  )
}
