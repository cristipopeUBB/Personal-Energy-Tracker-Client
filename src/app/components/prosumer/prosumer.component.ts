import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NgToastService } from 'ng-angular-popup';
import { UserStoreService } from '../../services/user-store.service';
import { Observable, catchError, map, mergeMap, throwError } from 'rxjs';

@Component({
  selector: 'app-prosumer',
  templateUrl: './prosumer.component.html',
  styleUrl: './prosumer.component.scss'
})
export class ProsumerComponent {

  public solarPanels: { [key: string]: number } = {
    "SunPower X-Series": 350,
    "LG Solar NeON 2": 350,
    "LG Solar NeOn R": 370,
    "Panasonic HIT": 340,
    "Canadian Solar HiKu": 380,
    "Canadian Solar KuMax": 370,
    "Jinko Solar Cheetah": 380,
    "Jinko Solar Tiger": 430,
    "Trina Solar Vertex": 430,
    "Trina Solar Honey": 370,
    "Hanwha Q CELLS Q.PEAK DUO": 345,
    "Hanwha Q.MAXX": 355,
    "LONGI Solar Hi-MO 4": 430,
    "LONGI Solar Hi-MO X": 450,
    "Risen Energy Jaegar": 400,
    "Risen Energy Titan": 500,
  }

  addSolarPanelForm!: FormGroup;
  userId: number = 0;
  fullName: string = '';
  public userSolarPanels: any = [];

  currentPage: number = 1; 

  constructor(private apiService: ApiService, private formBuilder: FormBuilder,
    private toast: NgToastService, private authService: AuthService, private userStoreService: UserStoreService) {
  }

  ngOnInit() {
    this.userStoreService.getFullNameFromStore()
      .subscribe(val => {
        let fullNameFromToken = this.authService.getFullNameFromToken();
        this.fullName = val || fullNameFromToken;
      });

    this.apiService.getUsers()
      .subscribe({
        next: (res: any) => {
          this.userId = res.find((user: any) => user.username === this.fullName).id;
          this.loadSolarPanelsOfCurrentUser().pipe(
            catchError(error => {
              console.error('Error loading devices:', error);
              return throwError(error);
            })).subscribe({
              next: () => {
                // Devices loaded successfully, now populate userDevices
              }
            });
        },
        error: () => {
          console.log("Error");
        }
      });

      this.addSolarPanelForm = this.formBuilder.group({
        name: ['', Validators.required],
        quantity: ['', Validators.required],
        userId: ['', Validators.required],
        power: ['', Validators.required]
      });
  }

  loadSolarPanelsOfCurrentUser() {
    return this.apiService.getUserSolarPanels(this.userId)
      .pipe(
        map((res: any[]) => {
          this.userSolarPanels = res.map(device => ({
            ...device,
          }));
          return this.userSolarPanels;
        }),
        catchError(error => {
          console.error('Error loading devices:', error);
          return throwError(error);
        })
      );
  }

  logout() {
    this.authService.signOut();
  }

  getSolarPanelNames(): string[] {
    return Object.keys(this.solarPanels);
  }

  deleteSolarPanel(solarPanel : any) {
    if (!confirm('Are you sure you want to delete this solar panel?')) {
      return;
    }

    this.apiService.deleteSolarPanel(solarPanel.id)
      .subscribe({
        next: (res: any) => {
          //reset the table data
          this.loadSolarPanelsOfCurrentUser().subscribe({
            next: () => {
            }
          });
          this.toast.success({
            detail: 'Success',
            summary: 'Solar panel deleted successfully!',
            duration: 3000,
          });
        },
        error: () => {
          console.log("Error");
        }
      });
  }

  addSolarPanel(){
    if(this.addSolarPanelForm.value.name === '') {
      this.toast.error({
        detail: 'ERROR',
        summary: 'Please select a device!',
        duration: 3000,
      });
      return;
    }

    this.addSolarPanelForm.patchValue({ userId: this.userId });
    const powerProduced = this.solarPanels[this.addSolarPanelForm.value.name];

    // Set the data in the form
    this.addSolarPanelForm.patchValue({
      power: powerProduced
    });

    // Submit the form
    this.apiService.addSolarPanel(this.addSolarPanelForm.value)
      .subscribe({
        next: (res: any) => {
          console.log(res);
          //reset the table data
          this.loadSolarPanelsOfCurrentUser().subscribe({
            next: () => {
              //reset the form
              this.addSolarPanelForm.reset();
            }
          });
          this.toast.success({
            detail: 'Success',
            summary: 'Solar panel added successfully!',
            duration: 3000,
          });
        },
        error: () => {
          console.log("Error");
        }
      });
  }
}
