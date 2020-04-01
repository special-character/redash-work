import React from 'react'
import Animated from 'react-native-reanimated'
import { withTimingTransition } from 'react-native-redash'
import { Button, View } from 'react-native'

const { add, sub } = Animated

const hookBoxHeight: Animated.Value<number> = new Animated.Value(100)
export default () => {
  const heightTransition = withTimingTransition(hookBoxHeight, {
    duration: 500,
  })
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          { height: heightTransition, width: 100, backgroundColor: 'red' },
        ]}
      ></Animated.View>

      <Button
        title="+ height"
        onPress={() => {
          console.log('SPRING')
          hookBoxHeight.setValue(add(hookBoxHeight, 200))
        }}
      ></Button>
      <Button
        title="- height"
        onPress={() => {
          console.log('SPRING')
          hookBoxHeight.setValue(sub(hookBoxHeight, 200))
        }}
      ></Button>
    </View>
  )
}
