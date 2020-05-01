import { Component, OnInit } from '@angular/core';
import { UserService } from '../core/user.service';
import { AuthService } from '../core/auth.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/firestore';
import { WorkoutService } from '../core/workout.service';

@Component({
  selector: 'page-user',
  templateUrl: 'user.component.html',
  styleUrls: ['user.scss']
})
export class UserComponent implements OnInit{

  workoutForm: FormGroup;
  workouts = [];
  userInfo;
  myWorkouts;
  userWorkoutLogs;
  users;
  selectedLeader;
  selectedLeaderName;

  constructor(
    public userService: UserService,
    public authService: AuthService,
    private location : Location,
    private fb: FormBuilder,
    public workoutService: WorkoutService
  ) {
    this.workoutService.getAllWorkouts();
  }

  ngOnInit(): void {
    this.userService.getCurrentUser().then((user) => {
      this.userInfo = user;
      this.userWorkoutLogs = this.workoutService.userWorkoutLogs;
      this.workouts = this.workoutService.workouts;
      this.users = this.workoutService.users;
    });
    this.workoutForm = this.fb.group(
      {
        workoutId: ['', Validators.required],
        count: ['', Validators.min(1)]
      }
    );
  }

  logout(){
    this.authService.doLogout()
    .then((res) => {
      this.location.back();
    }, (error) => {
      console.log("Logout error", error);
    });
  }

  onSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    let formData = this.workoutForm.value;
    if (!this.workoutForm.valid) {
      return;
    }
    formData.userId = this.userInfo.uid;
    formData.displayName = this.userInfo.displayName;
    formData.dateTime = Date.now();
    this.workoutService.saveWorkout(formData).then((ref) => {
      this.workoutForm.reset();
    });
  }

  leaderBoardSelect(event, id, name) {
    if (this.selectedLeader === id) {
      this.selectedLeader = null;
    } else {
      this.selectedLeader = id;
      this.selectedLeaderName = name;
    }
  }

}
