import { Tabs } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import S3 from "aws-sdk/clients/s3";

const musicContext = createContext({
  music: [] as Array<{
    url: string;
    name: string;
  }>,
  loading: true,
});

export const useMusic = () => {
  return useContext(musicContext);
};

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const [music, setMusic] = useState<
    Array<{
      url: string;
      name: string;
    }>
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const s3 = new S3({
      accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY,
      region: "us-east-1",
    });

    s3.listObjectsV2(
      {
        Bucket: "skanderfiles",
        Prefix: "music/",
      },
      (err, data) => {
        if (err) {
          console.log("Error", err);
          setLoading(false);
        } else {
          const music = data.Contents?.filter((o) => o.Key !== "music/").map(
            (f) => ({
              url: `https://skanderfiles.s3.amazonaws.com/${f.Key}`,
              name:
                f.Key?.split("/").pop()?.split(".").slice(0, -1).join(".") ??
                "",
            })
          );
          setMusic(music ?? []);
          setLoading(false);
        }
      }
    );
  });

  return (
    <musicContext.Provider value={{ music, loading }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "home" : "home-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "code-slash" : "code-slash-outline"}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </musicContext.Provider>
  );
}
