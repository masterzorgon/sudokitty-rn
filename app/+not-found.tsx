import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { playFeedback } from "@/src/utils/feedback";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>

        <Pressable
          style={styles.link}
          onPress={() => {
            playFeedback("tap");
            router.replace("/");
          }}
        >
          <Text style={styles.linkText}>Go to home screen</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Pally-Bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
