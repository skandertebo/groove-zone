import {
  Animated,
  Button,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  Audio,
  AVPlaybackStatus,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import { useEffect, useRef, useState } from "react";
import { useMusic } from "./_layout";

type FullSong = Audio.SoundObject & { uri: string; name: string };

export default function HomeScreen() {
  const { music, loading } = useMusic();
  const [selectedSong, _setSelectedSong] = useState<FullSong | null>(null);
  const initialPlayRef = useRef(true);
  const [isSongPlaying, setIsSongPlaying] = useState(false);

  function toggleSong(selectedSong: Audio.Sound) {
    let promise;
    if (selectedSong) {
      if (isSongPlaying) {
        promise = selectedSong.pauseAsync();
      } else {
        promise = selectedSong.playAsync();
      }
      setIsSongPlaying((prev) => !prev);
      return promise;
    }
    return Promise.resolve();
  }

  async function setSelectedSong(song: { uri: string; name: string }) {
    if (selectedSong) {
      await selectedSong.sound.unloadAsync();
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });
    const songObject = await Audio.Sound.createAsync({ uri: song.uri });
    setIsSongPlaying(true);
    await songObject.sound.playAsync();
    _setSelectedSong({
      ...songObject,
      uri: song.uri,
      name: song.name,
    });
  }

  useEffect(() => {
    if (selectedSong) return;
    if (music.length && !selectedSong && initialPlayRef.current) {
      initialPlayRef.current = false;
      setSelectedSong({
        uri: music[0].url,
        name: music[0].name,
      });
    }
  }, [music]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <MusicPlayer
          song={selectedSong}
          loading={loading || !selectedSong}
          toggleSong={toggleSong}
          isSongPlaying={isSongPlaying}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <Animated.ScrollView style={styles.stepContainer}>
        {music.map((song) => (
          <View
            style={{
              marginVertical: 8,
            }}
            key={song.url}
          >
            <Button
              title={song.name}
              onPress={() =>
                setSelectedSong({
                  uri: song.url,
                  name: song.name,
                })
              }
            />
          </View>
        ))}
      </Animated.ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    display: "flex",
    flexDirection: "column",
    marginBottom: 8,
    overflow: "scroll",
    height: 300,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  musicPlayer: {
    alignItems: "center",
    justifyContent: "center",
    height: 250,
    overflow: "hidden",
  },
});

export function MusicPlayer({
  song,
  loading,
  toggleSong,
  isSongPlaying,
}: {
  song: FullSong | null;
  loading: boolean;
  toggleSong: (song: Audio.Sound) => Promise<any>;
  isSongPlaying: boolean;
}) {
  const [info, setInfo] = useState<AVPlaybackStatus | null>(null);
  const scheme = useColorScheme();
  useEffect(() => {
    if (!song) return;
    song.sound.getStatusAsync().then(setInfo);
    const interval = setInterval(() => {
      song.sound.getStatusAsync().then(setInfo);
    }, 1000);
    return () => clearInterval(interval);
  }, [song]);

  return (
    <ThemedView style={styles.musicPlayer}>
      {loading ? (
        <ThemedText>Loading...</ThemedText>
      ) : (
        <>
          <ThemedText>{song?.name}</ThemedText>
          {info && (
            <ThemedText>
              {info.isLoaded && info.durationMillis ? (
                <View
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <Text
                    style={{
                      textAlign: "right",
                      fontSize: 12,
                      color: scheme === "dark" ? "white" : "black",
                    }}
                  >
                    {`${formatDuration(
                      Math.floor(info.positionMillis / 1000)
                    )} / ${formatDuration(
                      Math.floor(info.durationMillis / 1000)
                    )}`}
                  </Text>
                  <SongProgressBar
                    progress={info.positionMillis / info.durationMillis}
                  />
                </View>
              ) : (
                "Loading..."
              )}
            </ThemedText>
          )}
          <View
            style={{
              marginTop: 18,
            }}
          >
            <Pressable
              onPress={() => {
                if (!song) return;
                toggleSong(song.sound);
              }}
              style={{
                padding: 8,
                backgroundColor: "rgba(140,0,0,0.5)",
                borderRadius: 8,
                elevation: 8,
              }}
            >
              <ThemedText>{isSongPlaying ? "Pause" : "Play"}</ThemedText>
            </Pressable>
          </View>
        </>
      )}
    </ThemedView>
  );
}

function SongProgressBar({ progress }: { progress: number }) {
  return (
    <ThemedView
      style={{
        width: 300,
        height: 10,
        backgroundColor: "rgba(133,133,133,0.1)",
        borderRadius: 5,
        overflow: "hidden",
      }}
    >
      <ThemedView
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          backgroundColor: "rgba(80,0,0,0.5)",
        }}
      />
    </ThemedView>
  );
}

function formatDuration(duration: number) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}
