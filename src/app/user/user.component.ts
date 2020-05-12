import { Component, OnInit } from '@angular/core';
import { UserService } from '../core/user.service';
import { AuthService } from '../core/auth.service';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkoutService } from '../core/workout.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ChallengeService } from '../core/challenge.service';

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
  challengeId;
  challengeName;
  leaderBoardType = 'challenge';

  constructor(
    public userService: UserService,
    public authService: AuthService,
    private location : Location,
    private fb: FormBuilder,
    public workoutService: WorkoutService,
    private activatedRoute: ActivatedRoute,
    private challengeService: ChallengeService,
    private router: Router
  ) {
    this.workoutService.getAllWorkouts();
    this.activatedRoute.queryParams.subscribe(params => {
      this.challengeId = params['challengeId'] ? parseInt(params['challengeId']) : "";
      this.challengeName = params['challengeName'];
    });
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

  isCurrentChallenge() {
    if (this.challengeId) {
      let challenge = this.challengeService.getChallenge(this.challengeId);
      return challenge.currentChallenge;
    } else {
      return false;
    }
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
    if (this.challengeId) {
      const challenge = this.challengeService.getChallenge(this.challengeId);
      formData.challengeId = challenge.id;
      if (formData.dateTime > (challenge.end.seconds * 1000)) {
        alert('Challenge is already complete');
        return;
      } else if (formData.dateTime < (challenge.start.seconds * 1000)) {
        alert('Challenge has not started yet');
        return;
      }
    }
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

  switchLeaderboard(event, name) {
    event.preventDefault();
    event.stopPropagation();
    this.leaderBoardType = name;
  }

  navigateToChallenges(event) {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/challenges']);
  }

}
