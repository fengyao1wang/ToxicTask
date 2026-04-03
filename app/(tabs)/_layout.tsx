import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ff0055',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#2a2a2a',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#0a0a0a',
        },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '打卡',
          tabBarIcon: ({ color }) => <TabBarIcon name="check-square-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shame"
        options={{
          title: '耻辱墙',
          tabBarIcon: ({ color }) => <TabBarIcon name="fire" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '资产',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
