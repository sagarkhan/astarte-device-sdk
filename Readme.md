## Astarte NodeJS Device SDK

NodeJS Device SDK for [Astarte IOT Platform](https://github.com/astarte-platform/astarte). Create Astarte Devices and Simulators with NodeJS 14+. It integrates with [MQTT.js](https://github.com/mqttjs/MQTT.js) & [async-mqtt](https://github.com/mqttjs/async-mqtt#readme) to ensure a smooth developer experience and to hide complex details regarding MQTT interactions.


### Installation

Install with NPM
```
npm i astarte-device-sdk
```

Install with yarn

```
yarn add astarte-device-sdk
```

---

### Usage

#### Register Device

```
import { Pairing } from 'astarte-device-sdk'

/* Global Constants */

const astartePairingUrl = ""
const astartePairingToken = ""
const astarteRealm = ""

/* Initialize Pairing SDK */
const pairing = new Pairing({
	pairingUrl: astartePairingUrl,
	pairingToken: astartePairingToken,
	realm: astarteRealm
})

/* Register Device */
pairing.register({ hardwareId: "<uuid5 encoded device_id>" }).then((credentialSecret) => {
   /* Store this credentialSecret somewhere as this will be used later for 
   interacting with the device */
})

```


Once the device is registered and you saved the credentialSecret, the job of Pairing helper is all done, from here onwards you will be using Device SDK for all device related operations.

---

#### Initialize Device

```
import Device from 'astarte-device-sdk`

const device = new Device({
	pairingUrl: astartePairingUrl,
	pairingToken: astartePairingToken,
	realm: astarteRealm,
	hardwareId: "<uuid5 encoded device_id>", /* Used during registration */
	credentialSecret: deviceCredentialSecret, /* Got & Saved during registration */
	dir: "<path_to_local_file_directory>" /* This directory will be used by SDK to save device certificates */
})
```

---

#### Adding/Removing Interfaces in Device Introspection 

```
device.addInterface({ /* Astarte Interface Definition */ })
device.removeInterface(interfaceName)
```

---

#### Device Connection 

```
device.connect()
.then(() => /* Device Connected with Astarte Broker */)
.catch((err) => /* Device Connection Error */ )
```

---

#### Publishing Data

- Device SDK expose two seperate methods to publish device data.
	- `sendIndividual` : Used to publish data for interfaces that has `aggregation = individual`
	- `sendAggregate`: Used to publish data for interfaces that has `aggregation = object`
	

***sendIndividual ( interfaceName, path, value: number | string, timestamp?: Date): Promise***

```
device.sendIndividual('com.astarte.interface.Status', '/status/astarte/endpoint', 2.22, new  Date());
```

***sendAggregate ( interfaceName, path, value: Object, timestamp?: Date): Promise***
```
device.sendAggregate('com.astarte.interface.Status', '/status/astarte/endpoint', { name: "", age: "", city: "" }, new  Date());
```

Note: Timestamp is Optional

---

#### Subscribing Interfaces 

- In order to recieve data of a particular interface (Note: only the one's with `ownership=server`) you need to subscribe the device to that respective interface MQTT topic.

```
device.subscribe(interfaceName)
```

#### Receiving Data

```
device.on('message', (topic, payload) => {
	console.log(topic) /* MQTT Topic on which data is received */
	console.log(payload) /* Javascript Object of the data received */
})
```

---


Device SDK exposes following events which can be subscribed using  `device.on(eventName, callback)`  method. (Just like we did while receiving data)

#### Event `'connect'`

`function (connack) {}`

Emitted on successful (re)connection (i.e. connack rc=0).
* `connack` received connack packet. When `clean` connection option is `false` and server has a previous session
for `clientId` connection option, then `connack.sessionPresent` flag is `true`. When that is the case,
you may rely on stored session and prefer not to send subscribe commands for the client.

#### Event `'reconnect'`

`function () {}`

Emitted when a reconnect starts.

#### Event `'close'`

`function () {}`

Emitted after a disconnection.

#### Event `'disconnect'`

`function (packet) {}`

Emitted after receiving disconnect packet from broker. MQTT 5.0 feature.

#### Event `'offline'`

`function () {}`

Emitted when the client goes offline.

#### Event `'error'`

`function (error) {}`

Emitted when the client cannot connect (i.e. connack rc != 0) or when a
parsing error occurs.

The following TLS errors will be emitted as an `error` event:

* `ECONNREFUSED`
* `ECONNRESET`
* `EADDRINUSE`
* `ENOTFOUND`

#### Event `'end'`

`function () {}`

Emitted when <a href="#end"><code>mqtt.Client#<b>end()</b></code></a> is called.
If a callback was passed to `mqtt.Client#end()`, this event is emitted once the
callback returns.

#### Event `'message'`

`function (topic, message, packet) {}`

Emitted when the client receives a publish packet
* `topic` topic of the received packet
* `message` payload of the received packet
* `packet` received packet, as defined in
  [mqtt-packet](https://github.com/mcollina/mqtt-packet#publish)

#### Event `'packetsend'`

`function (packet) {}`

Emitted when the client sends any packet. This includes .published() packets
as well as packets used by MQTT for managing subscriptions and connections
* `packet` received packet, as defined in
  [mqtt-packet](https://github.com/mcollina/mqtt-packet)

#### Event `'packetreceive'`

`function (packet) {}`

Emitted when the client receives any packet. This includes packets from
subscribed topics as well as packets used by MQTT for managing subscriptions
and connections
* `packet` received packet, as defined in
  [mqtt-packet](https://github.com/mcollina/mqtt-packet)


#### Credits

- [Astarte IOT Platform](https://github.com/astarte-platform/astarte).

