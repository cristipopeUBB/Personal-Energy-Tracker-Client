import { Component } from '@angular/core';

@Component({
  selector: 'app-add-devices',
  templateUrl: './add-devices.component.html',
  styleUrl: './add-devices.component.scss'
})
export class AddDevicesComponent {
  public devices: { [key: string]: number } = { // This is a dictionary of devices and their power consumption in watts
    "Air Conditioner": 1800,
    "Clothes Dryer": 3000,
    "Clothes Iron": 2300,
    "Dishwasher": 1400,
    "Electric Kettle": 2000,
    "Fan": 70,
    "Heater": 2000,
    "Microwave Oven": 800,
    "Desktop Computer": 100,
    "Laptop Computer": 50,
    "Refrigerator": 200,
    "Stereo Receiver": 200,
    "Television": 70,
    "Toaster Oven": 1000,
    "Vacuum Cleaner": 1600,
    "Water Boiler": 1200,
    "Printer": 25,
    "Washing Machine": 2000,
    "Water Heater": 4000,
    "Air Fryer": 70,
    "Air Purifier": 27,
    "Coffee Maker": 1000,
    "Desk Lamp": 50,
    "Electric Boiler": 8000,
    "Electric Stove": 2000,
    "Espresso Coffee Machine": 1400,
    "EV Car Charger": 5000,
    "Gaming PC": 400,
    "Computer Monitor": 27,
    "Garage Door Opener": 350,
    "Home Internet Router": 10,
    "iMac": 140,
    "Jacuzzi": 4500,
    "Dehumidifier": 240,
    "Electric Blanket": 35,
    "Bathroom Fan": 12,
    "Food Blender": 350,
    "Laptop Computer 2": 75,
    "Laser Printer": 700,
    "Playstation 5": 170,
    "Playstation 4": 87,
    "Sandwich Maker": 800,
    "Toaster": 1200,
    "WiFi Router": 7,
    "Xbox One": 70,
    "60W Light Bulb": 60,
    "22 Inch LED TV": 17,
    "32 Inch LED TV": 35,
    "42 Inch LED TV": 58,
    "42 Inch Plasma TV": 450,
    "82 Inch LED TV": 228,
    "LED Light Bulb": 8
  };

  selectedDevice: string = '';
  public deviceConsumption: number | undefined;
  

  ngOnInit() {
    

  }

  getDeviceNames(): string[] {
    return Object.keys(this.devices);
  }

  onDeviceSelect() {
    this.deviceConsumption = this.devices[this.selectedDevice];
  }

  addDevice() {
    
  }
}
