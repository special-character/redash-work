import React from 'react'
import Animated from 'react-native-reanimated'
import { useTimingTransition } from 'react-native-redash'
import { Button, View } from 'react-native'

export default () => {
  const [hookBoxHeight, setHookBoxHeight] = React.useState(100)
  const heightTransition = useTimingTransition(hookBoxHeight, {
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
          setHookBoxHeight(hookBoxHeight + 200)
        }}
      ></Button>
      <Button
        title="- height"
        onPress={() => {
          console.log('SPRING')
          setHookBoxHeight(hookBoxHeight - 200)
        }}
      ></Button>
    </View>
  )
}
