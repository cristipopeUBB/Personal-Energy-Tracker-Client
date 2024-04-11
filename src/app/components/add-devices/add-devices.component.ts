import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UserStoreService } from '../../services/user-store.service';
import { AuthService } from '../../services/auth.service';
import { NgToastService } from 'ng-angular-popup';

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

  addDeviceForm!: FormGroup;
  selectedDevice: string = '';
  userId: number = 0;
  fullName: string = '';
  public deviceConsumption: number | undefined;
  public deviceHours: number | undefined; // TODO: Add validation for this field

  constructor(private apiService: ApiService, private fb: FormBuilder, private userStoreService : UserStoreService,
    private authService: AuthService, private toast: NgToastService) {
    
  }

  ngOnInit() {
    this.userStoreService.getFullNameFromStore()
      .subscribe(val => {
        let fullNameFromToken = this.authService.getFullNameFromToken();
        this.fullName = val || fullNameFromToken;
      });

    this.apiService.getUsers()
      .subscribe({
        next: (res:any) => {
          this.userId = res.find((user:any) => user.username === this.fullName).id;
        },
        error: () => {
          console.log("Error");
        }
    });

    this.addDeviceForm = this.fb.group({
      name: ['', Validators.required],
      consumption: ['', Validators.required],
      hoursUsed: ['', Validators.required],
      userId: ['', Validators.required]
    });

    // Subscribe to value changes on the form control
    this.addDeviceForm.get('name')!.valueChanges.subscribe((selectedDevice: string) => {
      this.onDeviceSelect(selectedDevice);
      this.addDeviceForm.get('consumption')!.setValue(this.deviceConsumption);
    });
  }

  getDeviceNames(): string[] {
    return Object.keys(this.devices);
  }

  onDeviceSelect(selectedDevice: string) {
    this.deviceConsumption = this.devices[selectedDevice];
  }

  addDevice() {
    this.addDeviceForm.patchValue({userId: this.userId})

    this.apiService.addDevice(this.addDeviceForm.value)
      .subscribe({
        next: (res:any) => {
          console.log(res);
          this.toast.success({
              detail: 'Success',
              summary: 'Device added successfully!',
              duration: 3000,
            });
        },
        error: () => {
          console.log("Error");
        }
      });
  }
}
