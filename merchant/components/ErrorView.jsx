import { router } from 'expo-router';
import { View, Text } from 'react-native';

import { COLORS, SIZES, FONT } from '../constants';
import Icon from 'react-native-vector-icons/FontAwesome5';

const ErrorView = ({ msg }) => {
  return (
    <View
      style={{
        alignItems: 'center',
        alignContent: 'center',
        marginVertical: 50,
      }}
    >
      <Icon name="exclamation-triangle" size={150} color={'#ff3020'} />

      <Text
        style={{
          alignSelf: 'center',
          fontSize: SIZES.xxLarge,
          color: COLORS.black,
          fontFamily: FONT.bold,
          alignItems: 'center',
          textAlign: 'center',
          marginTop: 20,
        }}
      >
        {msg}
      </Text>
    </View>
  );
};

export default ErrorView;
