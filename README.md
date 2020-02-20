# React Native Secured Storage

## Getting Started

### Install

```
yarn add react-native-secured-storage react-native-keychain https://github.com/SolidStateGroup/react-native-pbkdf2
```

or

```
npm install --save react-native-secured-storage react-native-keychain https://github.com/SolidStateGroup/react-native-pbkdf2
```

### Link

- **React Native 0.60+**


[CLI autolink feature](https://github.com/react-native-community/cli/blob/master/docs/autolinking.md) links the module while building the app. 


- **React Native <= 0.59**


```bash
$ react-native link react-native-keychain react-native-pbkdf2
```


*Note* For `iOS` using `cocoapods`, run:

```bash
$ cd ios/ && pod install
```

See docs for [manual linking guide](docs/Linking.md)

### **Upgrading to React Native *0.60+*** 
 
New React Native comes with `autolinking` feature, which automatically links Native Modules in your project.
In order to get it to work, make sure you `unlink` dependencies first first:

```bash
$ react-native unlink react-native-keychain react-native-pbkdf2
```

## Usage

### Import

```js
import SecuredStorage from 'react-native-secured-storage';
```

### Initialise

```js
await SecuredStorage.init('mypassword');
```

### Unlock storage / Get data

`get()` would be called once on relaunching the app if secured storage has already been initialised.

```js
const storage = await SecuredStorage.get();
const mydata = storage['mydata'];
const mydata2 = SecuredStorage.storage['mydata2'];
```

### Store data

```js
await SecuredStorage.setItem('key', {complex: 'object'});
await SecuredStorage.setItem('key', null, 'or just a string');
```

### Remove data

```js
await SecuredStorage.removeItem('key');
```