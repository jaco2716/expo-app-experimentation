import { PropsWithChildren, useEffect } from "react";
import {
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

type Props = PropsWithChildren<{
  isVisible: boolean;
  isScrollable?: boolean;
  onClose: () => void;
}>;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function BottomSheet({
  isVisible,
  isScrollable,
  onClose,
  children,
}: Props) {
  const { top } = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const keyboardOffset = useSharedValue(0);

  useEffect(() => {
    if (isVisible) translateY.value = withSpring(0);
  }, [isVisible]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        console.log(e.endCoordinates.height);
        keyboardOffset.value = withTiming(e.endCoordinates.height, {
          duration: 250,
        });
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        console.log(0);
        keyboardOffset.value = withTiming(0, { duration: 250 });
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 200) {
        // dismiss
        console.log("dismiss");
        scheduleOnRN(onClose);
        translateY.value = withSpring(SCREEN_HEIGHT);
      } else {
        // snap back
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value - keyboardOffset.value }],
    maxHeight: SCREEN_HEIGHT - keyboardOffset.value - top,
  }));

  const InnerView = isScrollable ? ScrollView : View;

  return (
    <Modal animationType="fade" transparent visible={isVisible}>
      <View style={styles.overlay}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.modalContent, animatedStyle]}>
            <InnerView style={[styles.innerContainer]}>{children}</InnerView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#25292e",
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
  },
  innerContainer: { paddingVertical: 100 },
  titleContainer: {
    height: 50,
    backgroundColor: "#464C55",
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#fff",
    fontSize: 16,
  },
});
