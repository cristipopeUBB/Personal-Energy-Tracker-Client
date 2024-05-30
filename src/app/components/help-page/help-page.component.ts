import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NgToastService } from 'ng-angular-popup';
import { UserStoreService } from '../../services/user-store.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-help-page',
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.scss'
})
export class HelpPageComponent {

  editUserForm!: FormGroup;
  userId: number = 0;
  fullName: string = '';
  public isUserProsumer: any = false;

  constructor(private apiService: ApiService, private toast: NgToastService, private formBuilder: FormBuilder,
    private userStoreService: UserStoreService, private authService: AuthService) {

   }

  ngOnInit() {
    this.editUserForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
      id: ['', Validators.required]
    });

    this.userStoreService.getFullNameFromStore()
      .subscribe(val => {
        let fullNameFromToken = this.authService.getFullNameFromToken();
        this.fullName = val || fullNameFromToken;
      });

    this.apiService.getUsers()
      .subscribe({
        next: (res: any) => {
          this.userId = res.find((user: any) => user.username === this.fullName).id;
          this.isUserProsumer = res.find((user: any) => user.username === this.fullName).isProsumer;
        },
        error: () => {
          console.log("Error");
        }
      });

    this.editUserForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
      id: ['', Validators.required]
    });
  }

  isAddDeviceModalOpen: boolean = false;

  // Method to open the modal
  openAddDeviceModal() {
    this.isAddDeviceModalOpen = true;
  }

  // Method to close the modal
  closeAddDeviceModal() {
    this.isAddDeviceModalOpen = false;
  }

  logout() {
    this.authService.signOut();
  }

  editUserSettings() {
    this.editUserForm.patchValue({ id: this.userId });
    this.apiService.editUser(this.editUserForm.value)
    .subscribe({
      next: (res: any) => {
        this.toast.success({
          detail: 'Success',
          summary: 'User settings updated successfully!',
          duration: 3000,
        });
      },
      error: () => {
        console.log("Error");
      }
    });
  }
}
