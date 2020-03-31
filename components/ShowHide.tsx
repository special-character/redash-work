import React from 'react'
import Animated from 'react-native-reanimated'
import { Button, View } from 'react-native'

const {
  add,
  block,
  Clock,
  clockRunning,
  cond,
  Extrapolate,
  eq,
  interpolate,
  not,
  set,
  startClock,
  stopClock,
  useCode,
} = Animated

const clock = new Clock()
const time = new Animated.Value(0)
const progress = new Animated.Value(0)

export default () => {
  const duration = 2000
  const [show, setShow] = React.useState(true)

  const opacity = interpolate(progress, {
    inputRange: [0, 1],
    outputRange: show ? [0, 1] : [1, 0],
    extrapolate: Extrapolate.CLAMP,
  })

  useCode(
    () =>
      block([
        // 1. If clock not running, start the clock and save original clock value in time
        cond(not(clockRunning(clock)), [startClock(clock), set(time, clock)]),
        // 2. calculate the progress of the animation
        set(
          progress,
          interpolate(clock, {
            inputRange: [time, add(time, duration)],
            outputRange: [0, 1],
          }),
        ),
        // 3. if the animation is over, stop the clock
        cond(eq(progress, 1), stopClock(clock)),
      ]),
    [show],
  )
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          { height: 100, width: 100, backgroundColor: 'red' },
          { opacity },
        ]}
      >
        <Button
          title="fuck this"
          onPress={() => setShow((prev) => !prev)}
        ></Button>
      </Animated.View>
    </View>
  )
}
